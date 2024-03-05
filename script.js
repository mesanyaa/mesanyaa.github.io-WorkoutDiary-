"use strict";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// Иконка для маркера на карте
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Класс тренировки
class Workout {
  date = new Date();
  // Уникальный идентификатор тренировки
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// Класс бега
class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Класс езды на велосипеде
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// Класс для запуска приложения
class App {
  #workouts = [];
  #map;
  #mapEvent;
  constructor() {
    this.#getPosition();

    // Получение данных из Local Storage
    this.#getLocalStorage();

    form.addEventListener("submit", this.#newWorkout.bind(this));

    inputType.addEventListener("change", this.#toggleField);

    containerWorkouts.addEventListener("click", this.#moveToPopup.bind(this));
  }
  // Метод запроса доступа к местоположению пользователя
  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        // Функция, сработающая в случае предоставления доступа к геолокации
        this.#loadMap.bind(this),
        // Функция, сработающая в случае НЕ предоставления доступа к геолокации
        function () {
          alert("Вы не предоставили доступ к своей геопозиции");
        }
      );
  }
  // Метод загрузки карты на страницу
  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this.#showForm.bind(this));

    this.#workouts.forEach((work) => {
      this.#renderWorkMarker(work);
    });
  }
  // Метод для отображения формы (при нажатии на любое место на карте)
  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  // Метод для установки маркера на карте
  #newWorkout(e) {
    e.preventDefault();

    // Валидация данных из форм
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
    // Получение данных из форм
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert("Необходимо ввести целое положительное число");
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert("Необходимо ввести целое положительное число");
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    // Рендер маркера тренировки на карте
    this.#renderWorkMarker(workout);

    // Рендер тренировки после отправки формы
    this.#renderWorkout(workout);

    // Спрятать форму после отправки
    this.#hideForm();

    this.#setLocaleStorage();
  }
  // Метод скрытия формы после отправки
  #hideForm() {
    // Очистка полей ввода
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.classList.add("hidden");
  }
  // Рендер маркера тренировки на карте
  #renderWorkMarker(workout) {
    L.marker(workout.coords, { icon: redIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "mark-popup",
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴"} ${workout.description}`
      )
      .openPopup();
  }
  // Метод для переключения вида тренировки
  #toggleField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  #renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">мин</span>
          </div>
    `;
    if (workout.type === "running") {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">мин/км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">шаг</span>
          </div>
        </li>
      `;
    }
    if (workout.type === "cycling") {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">км/час</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">м</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML("afterend", html);
  }
  #moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  #setLocaleStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach((work) => {
      this.#renderWorkout(work);
    });
  }
  //Метод сброса приложения
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}
// Запуск приложения
const app = new App();
