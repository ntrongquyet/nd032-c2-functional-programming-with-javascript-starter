const API_URL = "http://localhost:3000"

// Get the root element of the web page
const rootElement = document.getElementById('root');

// Function to update the store with the ability to use a callback
const updateStore = async (currentRoot, currentStore, newState = {}, callback = null) => {
  const newStore = currentStore.mergeDeep(newState);
  await render(currentRoot, newStore);
  if (callback !== null) return callback(newStore);
};

// Function to render the interface
const render = async (currentRoot, state) => {
  currentRoot.innerHTML = generateAppHtml(currentRoot, state);
};

// Function to generate the HTML content for the app
const generateAppHtml = (currentRoot, state) => {
  const user = state.get('user');
  const rovers = state.get('rovers');
  const selectedRoverGal = state.get('selectedRoverGal');
  const roversHtml = rovers && rovers.map((rover) => generateRoverCardHtml(state, rover)).join('');
  const gal = selectedRoverGal && selectedRoverGal.get('photos') && selectedRoverGal.get('photos').map((photo) => generatePhotoModalHtml(photo)).join('');

  return `
        <header class="container-fluid">
            Mars Dashboard
        </header>
        <main class="container-fluid">
            <div class="jumbotron">
                ${generateGreetingHtml(user.get('name'))}
                <p class="lead">Mars rover dashboard that consumes the NASA API</p>
            </div>

            <div class="row">
                ${rovers ? roversHtml : generateSpinnerHtml()}
            </div>
            <div class="row row-cols-1 row-cols-md-3">
                ${selectedRoverGal ? gal : ''}
            </div>
        </main>
        <footer></footer>
    `;
};

// Listen for the load event to ensure the web page loads before any JavaScript is executed
window.addEventListener('load', () => {
  const store = Immutable.Map({
    user: Immutable.Map({ name: 'Student' }),
    selectedRover: false,
    selectedRoverGal: false
  });
  render(rootElement, store);
  getListOfRovers((data) => {
    const rovers = Immutable.Map({
      rovers: Immutable.fromJS(data.rovers)
    });
    updateStore(rootElement, store, rovers);
  });
});

// Function to generate greetings HTML
const generateGreetingHtml = (name) => {
  if (name) {
    return `<h1 class="display-4">Welcome, ${name}!</h1>`;
  }
  return '<h1 class="display-4">Hello!</h1>';
};

// Function to generate Spinner HTML
const generateSpinnerHtml = () => {
  return `
        <div class="text-center spinner-grow text-success" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        `;
};

// Function to generate Photo Modal HTML
const generatePhotoModalHtml = (photo) => {
  const url = photo.get('img_src');
  const alt = photo.get('camera').get('full_name');
  const fullCamName = photo.get('camera').get('full_name');
  const earthDate = photo.get('earth_date');
  const roverName = photo.get('rover').get('name');
  const landingDate = photo.get('rover').get('landing_date');
  const launchDate = photo.get('rover').get('launch_date');
  const title = `${roverName} - ${fullCamName}`;
  const status = photo.get('rover').get('status');

  const description = `This is a photo from ${fullCamName} for ${roverName}.<br /><br />
   ${roverName} has a${status === 'active' ? 'n' : ''} ${status} status.<br /><br />
   ${roverName} landed on Mars in ${landingDate}<br /><br />
   This project was launched in ${launchDate}<br /><br />
   This picture was taken on ${earthDate}
  `;

  return `
    <div class="col mb-4">
        <div class="card h-100">
            <img src="${url}" class="card-img-top" alt="${alt}">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">${description}</p>
            </div>
        </div>
    </div>
    `;
};

// Function to generate Rover Card HTML
const generateRoverCardHtml = (store, rover) => {
  return (`
        <div class="col-sm-6 mb-2">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${rover.get('name')}</h5>
                    <p class="card-text">This rover launched in ${rover.get('launch_date')}, landed on Mars in ${rover.get('landing_date')} and is now ${rover.get('status')}</p>
                    <button  class="btn btn-light" onclick="displayRover(${toStrArgs(store)}, ${toStrArgs(rover)})">
                        ${
                            store.get('selectedRover') && store.get('selectedRover').get('loading') && store.get('selectedRover').get('name') === rover.get('name')
                            ? `<div class="spinner-border text-success" role="status">
                                    <span class="visually-hidden">Loading...</span>
                               </div>`
                            : 'See Latest Image'
                        }
                    </button>
                </div>
            </div>
        </div>
    `);
};

// Function to convert an object to a string
const toStrArgs = (args) => {
  return JSON.stringify(args).replace(/"/g, "'");
};

// Display rover information
const displayRover = (store, data) => {
  const selectedRover = Immutable.Map({
    selectedRoverGal: false,
    selectedRover: Immutable.fromJS({ ...data, loading: true })
  });

  updateStore(rootElement, Immutable.fromJS(store), selectedRover, processRover);
};

// Process rover data
const processRover = (state) => {
  const currentRover = state.get('selectedRover');
  getRoverData(currentRover.get('name'), currentRover.get('max_date'), (data) => {
    const updatedRoverData = Immutable.Map({
      selectedRoverGal: Immutable.fromJS({ ...data }),
      selectedRover: Immutable.fromJS({ loading: false })
    });
    updateStore(rootElement, state, updatedRoverData);
  });
};

// Function to get the list of rovers
const getListOfRovers = (callback) => {
  fetch(`${API_URL}/rovers`)
    .then(res => res.json())
    .then(json => callback(json));
};

// Function to get rover data
const getRoverData = (roverName, maxDate, callback) => {
  fetch(`${API_URL}/rovers/${roverName}?max_date=${maxDate}`)
    .then(res => res.json())
    .then(json => callback(json));
};
