'use strict';

// prettier-ignore


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();

        this._getLocalStorage()
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this))
    }
    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Could not get your locatiion')
            })

    }
    _loadMap(position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const cords = [latitude, longitude]
        // const map=`https://www.google.com/maps/@${latitude},${longitude}`
        this.#map = L.map('map').setView(cords, 13);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this))
        this.#workouts.forEach(work=>{this._renderWorkoutMarker(work)})

    }
    _showForm(mapE) {
        this.#mapEvent = mapE
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');

    }
    _hideForm(){
        inputDistance.value = inputElevation.value = inputCadence.value = inputDuration.value = ''
        form.style.display='none';
        form.classList.add('hidden');
        setTimeout(()=>form.style.display='grid',1000)
    }
    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))
        const allPositive = (...inputs) => inputs.every(inp => inp > 0)
        e.preventDefault();
        const { lat, lng } = this.#mapEvent.latlng;
        //get data
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;
        if (type === 'running') {
            const cadance = +inputCadence.value;
            if (!validInputs(distance, duration, cadance) ||
                !allPositive(distance, duration, cadance)) return alert('input have to be positiv number')
            workout = new Running([lat, lng], distance, duration, cadance);

        }

        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)) return alert('input have to be positiv number')
            workout = new Running([lat, lng], distance, duration, elevation);
        }

        this.#workouts.push(workout)

        this._renderWorkoutMarker(workout)

        this._renderWorkout(workout)
        ///clear
        this._hideForm()
        
       this._setLocalStorage()
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,

            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`)
            .openPopup();
    }
    _renderWorkout(workout) {
        let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.distance}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
    </div>`
        if (workout.type === 'running') {
            html += ` <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadance}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`
        }
        if (workout.type === 'cycling') {
            html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
      </div>
    </li> -->`
        }
        form.insertAdjacentHTML('afterend', html)
    }
    _moveToPopup(e){
        const workoutEl=e.target.closest('.workout');
        if(!workoutEl) return;
        const workout=this.#workouts.find(work=>work.id===workoutEl.dataset.id)
        this.#map.setView(workout.coords , 13,{
            animation:true,
            pan:{
                duration:1
            }
        })
       
    }
    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));//dont add larg emound of data
        
    }
    _getLocalStorage(){
        const data=JSON.parse(localStorage.getItem('workouts'))
        if(!data)return;
        this.#workouts=data;
        this.#workouts.forEach(work=>this._renderWorkout(work))

    }
    reset(){
        localStorage.removeItem('workouts')
        location.reload() //reload the page
    }
}
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
  
    constructor(coords, distance, duration) {
      // this.date = ...
      // this.id = ...
      this.coords = coords; // [lat, lng]
      this.distance = distance; // in km
      this.duration = duration; // in min
    }
  
    _setDescription() {
      // prettier-ignore
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
        months[this.date.getMonth()]
      } ${this.date.getDate()}`;
    }
  
  }
  
class Running extends Workout {
    type = 'running'
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence
        this.calcPace();
        this._setDescription()
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace
    }
}
class Cycling extends Workout {
    type = 'cycling'
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed()
        this._setDescription()

    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed
    }
}
const app = new App()








