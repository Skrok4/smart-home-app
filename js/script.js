window.addEventListener('load', async () => {

  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('/sw.js')
      console.log('Service worker register success', reg)
    } catch (e) {
      console.log('Service worker register fail')
    }
  }
  await loadPosts()
});

const dom = {
  selectBox: document.getElementById("selectBox"),
  selectBoxList: document.querySelector(".selectBox__list"),
  rooms: document.getElementById("rooms"),
  settings: document.getElementById("settings"),
  settingsTabs: document.getElementById("settings__tabs"),
  settingsPanels: document.getElementById("settings-panel"),
  temperatureLine: document.getElementById("temperature-line"),
  temperatureRound: document.getElementById("temperature-round"),
  temperature: document.getElementById("temperature"),
  temperatureBtn: document.getElementById("temperature-btn"),
  temperatureSaveBtn: document.getElementById("save-temperature"),
  powerBtn: document.getElementById("power"),
  sliders: {
    lights: document.getElementById("lights-slider"),
    humidity: document.getElementById("humidity-slider"),
  },
  switch: {
    lights: document.getElementById("lights-power"),
    humidity: document.getElementById("humidity-power"),
  },
};
const rooms = {
  all: "All rooms",
  living_room: "Living room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  studio: "Studio",
  washing_room: "Washing Room",
};

let activeRoom = "all";
let activeTab = "temperature";
const roomsData = {
  living_room: {
    temperature: 18,
    temperatureStatus: true,
    lights: 60,
    lightsOff: false,
    humidity: 30,
    humidityOff: false,
  },
  bedroom: {
    temperature: 24,
    temperatureStatus: true,
    lights: 80,
    lightsOff: false,
    humidity: 64,
    humidityOff: true,
  },
  kitchen: {
    temperature: 16,
    temperatureStatus: false,
    lights: 0,
    lightsOff: true,
    humidity: 0,
    humidityOff: true,
  },
  bathroom: {
    temperature: 20,
    temperatureStatus: true,
    lights: 85,
    lightsOff: true,
    humidity: 25,
    humidityOff: true,
  },
  studio: {
    temperature: 16,
    temperatureStatus: false,
    lights: 50,
    lightsOff: false,
    humidity: 0,
    humidityOff: false,
  },
  washing_room: {
    temperature: 16,
    temperatureStatus: false,
    lights: 0,
    lightsOff: false,
    humidity: 42,
    humidityOff: false,
  },
};

//drop-down list
dom.selectBox.querySelector(".selectBox__selected").onclick = (event) => {
  dom.selectBox.classList.toggle("open");
};

document.body.onclick = (event) => {
  const { target } = event;
  if (
    !target.matches(".selectBox") &&
    !target.parentElement.matches(".selectBox__selected") &&
    !target.parentElement.parentElement.matches(".selectBox")
  ) {
    dom.selectBox.classList.remove("open");
  }
};

dom.selectBoxList.onclick = (event) => {
  const { target } = event;
  if (target.matches(".selectBox__item")) {
    const { room } = target.dataset;
    const selectedItem = dom.selectBoxList.querySelector(".selected");
    selectedItem.classList.remove("selected");
    target.classList.add("selected");
    dom.selectBox.classList.remove("open");
    selectRoom(room);
  }
};

// Choosing room
const selectRoom = (room) => {
  const selectedRoom = dom.rooms.querySelector(".selected");
  if (selectedRoom) {
    selectedRoom.classList.remove("selected");
  }
  if (room !== "all") {
    const newSelectedRoom = dom.rooms.querySelector(`[data-room=${room}]`);
    const { temperature, lights, humidity, lightsOff, humidityOff } = roomsData[room];
    activeRoom = room;
    newSelectedRoom.classList.add("selected");
    renderScreen(false);
    dom.temperature.innerText = temperature;
    renderTemperature(temperature);
    setTemperaturePower();
    changeSettingsType(activeTab);
    changeSlider(lights, dom.sliders.lights);
    changeSlider(humidity, dom.sliders.humidity);
    changeSwitch("lights", lightsOff)
    changeSwitch("humidity", humidityOff)
  } else {
    renderScreen(true);
  }
  const selectedSelectBoxRoom = dom.selectBox.querySelector(
    ".selectBox__item.selected"
  );
  selectedSelectBoxRoom.classList.remove("selected");
  const newSelectedItem = dom.selectBox.querySelector(`[data-room=${room}]`);
  newSelectedItem.classList.add("selected");
  const selectBoxSelected = dom.selectBox.querySelector(
    ".selectBox__selected span"
  );
  selectBoxSelected.innerText = rooms[room];
};

// Click to element
dom.rooms.querySelectorAll(".room").forEach((room) => {
  room.onclick = (event) => {
    const value = room.dataset.room;
    selectRoom(value);
  };
});

// Show selected screen
const renderScreen = (isRooms) => {
  setTimeout(() => {
    if (isRooms) {
      dom.rooms.style.display = "grid";
      dom.settings.style.display = "none";
    } else {
      dom.rooms.style.display = "none";
      dom.settings.style.display = "block";
    }
  }, 500);
};

//--- Panel settings room ---
//drawing temperature changes
const renderTemperature = (temperature) => {
  const minTemp = 16;
  const maxTemp = 40;
  const range = maxTemp - minTemp;
  const measure = range / 100;
  const lineMin = 54;
  const lineMax = 276;
  const lineRange = lineMax - lineMin;
  const lineMeasure = lineRange / 100;
  const roundMin = -240;
  const roundMax = 48;
  const roundRange = roundMax - roundMin;
  const roundMeasure = roundRange / 100;

  if (temperature >= minTemp && temperature <= maxTemp) {
    const finishPercent = Math.round((temperature - minTemp) / measure);
    const lineFinishPercent = lineMin + lineMeasure * finishPercent;
    const roundFinishPercent = roundMin + roundMeasure * finishPercent;
    dom.temperatureLine.style.strokeDasharray = `${lineFinishPercent} 276 `;
    dom.temperatureRound.style.transform = `rotate(${roundFinishPercent}deg`;
    dom.temperature.innerText = temperature;
  }
};


// Change temperature
const changeTemperature = () => {
  let mouseOver = false;
  let mouseDown = false;
  let position = 0;
  let range = 0;
  let change = 0;

  dom.temperatureBtn.onmouseover = () => {
    mouseOver = true;
    mouseDown = false;
  }
  dom.temperatureBtn.onmouseout = () => (mouseOver = false);
  dom.temperatureBtn.onmouseup = () => (mouseDown = false);
  dom.temperatureBtn.onmousedown = (e) => {
    mouseDown = true;
    position = e.offsetY;
    range = 0;
  };
  dom.temperatureBtn.onmousemove = (e) => {
    if (mouseOver && mouseDown) {
      range = e.offsetY - position;
      const newChange = Math.round(range / -10);
      if (newChange !== change) {
        let temperature = +dom.temperature.innerText;
        if (newChange < change) {
          temperature -= 1;
        } else {
          temperature += 1;
        }
        change = newChange;
        renderTemperature(temperature);
      }
    }
  };
};
changeTemperature();

// Save temperature after click btn
dom.temperatureSaveBtn.onclick = () => {
  const temperature = +dom.temperature.innerText;
  roomsData[activeRoom].temperature = temperature;
  alert(`Temperature ${temperature}°C in ${[activeRoom]} saved!`);
};

// Disable heater
dom.powerBtn.onclick = () => {
  const power = dom.powerBtn;
  power.classList.toggle("off");
  if (power.matches("off")) {
    roomsData[activeRoom].temperatureStatus = false;
  } else {
    roomsData[activeRoom].temperatureStatus = true;
  }
};

const setTemperaturePower = () => {
  if (roomsData[activeRoom].temperatureStatus) {
    dom.powerBtn.classList.remove("off");
  } else {
    dom.powerBtn.classList.add("off");
  }
};
const clearSelection = () => {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else {
    document.selection.empty();
  }
};

// Switch option section
dom.settingsTabs.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    const optionType = tab.dataset.type;
    activeTab = optionType;
    changeSettingsType(optionType);
  };
});

// Changing option tab
const changeSettingsType = (type) => {
  const tabSelected = dom.settingsTabs.querySelector(".tab.selected");
  const tab = dom.settingsTabs.querySelector(`[data-type=${type}]`);
  const panelSelected = dom.settingsPanels.querySelector(".selected");
  const panel = dom.settingsPanels.querySelector(`[data-type=${type}]`);
  tabSelected.classList.remove("selected");
  panelSelected.classList.remove("selected");
  tab.classList.add("selected");
  panel.classList.add("selected");
};

const changeSlider = (percent, slider) => {
  if (percent >= 0 && percent <= 100) {
    const { type } = slider.parentElement.parentElement.dataset;
    slider.querySelector("span").innerText = percent;
    slider.style.height = `${percent}%`;
    roomsData[activeRoom][type] = percent;
  }
};

const watchSlider = (slider) => {
  let mouseOver = false;
  let mouseDown = false;
  let position = 0;
  let range = 0;
  let change = 0;
  const parent = slider.parentElement;

  parent.onmouseover = () => {
    mouseOver = true;
    mouseDown = false;
  };
  parent.onmouseout = () => (mouseOver = false);
  parent.onmouseup = () => (mouseDown = false);
  parent.onmousedown = (e) => {
    mouseDown = true;
    position = e.offsetY;
    range = 0;
  };
  parent.onmousemove = (e) => {
    if (mouseOver && mouseDown) {
      range = e.offsetY - position;
      const newChange = Math.round(range / -2);
      if (newChange !== change) {
        let percent = +slider.querySelector("span").innerText;
        if (newChange < change) {
          percent -= 1;
        } else {
          percent += 1;
        }
        change = newChange;
        changeSlider(percent, slider);
      }
    }
  };
};
watchSlider(dom.sliders.lights);
watchSlider(dom.sliders.humidity);

// Turn off/on lights, humidity
const changeSwitch = (activeTab, isOff) => {
  if (isOff) {
    dom.switch[activeTab].classList.add("off");
  } else {
    dom.switch[activeTab].classList.remove("off")
  }
  roomsData[activeRoom][`${activeTab}Off`] = isOff;
}

// Clicking on the switch
dom.switch.humidity.onclick = () => {
  const isOff = !dom.switch.humidity.matches(".off");
  changeSwitch(activeTab, isOff)
}
dom.switch.lights.onclick = () => {
  const isOff = !dom.switch.lights.matches(".off");
  changeSwitch(activeTab, isOff)
}

const greeting = () => {
  const wraper = document.getElementById("wrapper")
  const penguin = document.querySelector(".penguin")
  setTimeout(() => {
    penguin.style.display = "none"
    wraper.style.display = "block"
  }, 3000);
}
greeting()