class ElementBuilder {
  constructor(elementType) {
    this._child = document.createElement(elementType);
  }

  setId(elementId) {
    this._child.id = elementId;
    return this;
  }

  setClass(elementClass) {
    this._child.classList.add(elementClass);
    return this;
  }

  setText(text) {
    this._child.textContent = text;
    return this;
  }

  addListener(eventName, callback) {
    this._child.addEventListener(eventName, callback);
    return this;
  }

  appendTo(parent) {
    parent.appendChild(this._child);
    return this;
  }

  getResult() {
    return this._child;
  }
}

class FullScreen {
  constructor() {
    if (this._isFullscreenSupported) {
      this._addButton();
    }
  }

  get _isFullscreenSupported() {
    // Überprüfen, ob das Fullscreen-API unterstützt wird
    const element = document.documentElement;
    return (
      element.requestFullscreen ||
      element.mozRequestFullScreen || // Firefox
      element.webkitRequestFullscreen || // Chrome, Safari und Opera
      element.msRequestFullscreen // Internet Explorer
    );
  }

  _addButton() {
    const button = document.getElementById("fullscreen-button");
    button.textContent = "FULL SCR";
    button.hidden = false;
    button.addEventListener("click", () => this._handleFullscreenButtonClick());
  }

  _handleFullscreenButtonClick() {
    const button = document.getElementById("fullscreen-button");
    if (button.textContent !== "NORMAL") {
      button.textContent = "NORMAL";
      this._activateFullscreen();
    } else {
      button.textContent = "FULL SCR";
      this._deactivateFullscreen();
    }
  }

  _activateFullscreen() {
    // Funktion, um den Vollbildmodus zu aktivieren
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }

  _deactivateFullscreen() {
    // Funktion, um den Vollbildmodus zu deaktivieren
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

class LockScreen {
  constructor() {
    if (this._isLockScreenSupported) {
      this._addButton();
    }
  }

  get _isLockScreenSupported() {
    return this._screenOrientation !== null;
  }

  _addButton() {
    const button = document.getElementById("fixed-orientation-button");
    button.textContent = `LOCK ${this._screenOrientation?.type.split("-")[0]}`;
    button.hidden = false;
    button.addEventListener("click", () => this._handleLockButtonClick());

    window.addEventListener('deviceorientation', () => this._handleScreenOrientation());
  }

  get _isScreenLocked() {
    return screen.orientation && screen.orientation.type === 'portrait-primary';
  }

  _handleLockButtonClick() {
    const button = document.getElementById("fixed-orientation-button");
    if (button.textContent !== "UNLOCK") {
      button.textContent = "UNLOCK";
    } else {
      button.textContent = `LOCK ${
        this._screenOrientation?.type.split("-")[0]
      }`;
    }
  }

  _handleScreenOrientation() {
    const button = document.getElementById("fixed-orientation-button");
    if (button.textContent !== "UNLOCK") {
      this._unlockScreenOrientation()
    } else {
      this._lockScreenOrientation();
    }
  }

  _lockScreenOrientation() {
    if (this._screenOrientation && this._screenOrientation.lock) {
      this._screenOrientation.lock(this._screenOrientation?.type);
    }
  }

  _unlockScreenOrientation() {
    if (this._screenOrientation && this._screenOrientation.unlock) {
      this._screenOrientation.unlock();
    }  
  }

  get _screenOrientation() {
    return screen.orientation || screen.mozOrientation || screen.msOrientation;
  }
}

class ModalDialog {
  constructor() {
    this._notification = null;
    this._overlay = null;
    this._text = null;
    this._button = null;
    this._notificationTimeout = null;
    this._action = null;
    this._setupHtml();
  }

  showAlert(message, performAfterHiding) {
    // Nachricht und Aktion werden gesetzt
    this._text.textContent = message;
    this._action = performAfterHiding;

    // Anzeigen der Modal-Box
    this._notification.style.display = "block";
    this._overlay.style.display = "block";

    // Neues Timeout starten
    this._notificationTimeout = setTimeout(
      () => this._hideNotification(),
      5000
    );
  }

  _hideNotification() {
    // Modal-Box wird ausgeblendet
    this._notification.style.display = "none";
    this._overlay.style.display = "none";

    // perform action after hiding of notification
    if (this._action) {
      this._action();
    } else {
      console.warn("As action is undefined, nothing is performed.");
    }

    // Timeout zurücksetzen
    clearTimeout(this._notificationTimeout);
  }

  _setupHtml() {
    const root = document.getElementById("root");

    this._overlay = new ElementBuilder("div")
      .setId("overlay")
      .setClass("overlay")
      .appendTo(root)
      .getResult();

    this._notification = new ElementBuilder("div")
      .setId("notification")
      .setClass("modal")
      .appendTo(root)
      .getResult();

    this._text = new ElementBuilder("p")
      .setId("message")
      .appendTo(this._notification)
      .getResult();

    const bc = new ElementBuilder("div")
      .setClass("button-container")
      .appendTo(this._notification)
      .getResult();

    this._button = new ElementBuilder("button")
      .setId("confirm")
      .setText("OK")
      .appendTo(bc)
      .addListener("click", this._hideNotification.bind(this))
      .getResult();
  }
}

class Board {
  constructor(model) {
    this._tiles = Array(model.size);
    this._selectedTile = null;
    this._notifySelectionChanged = null;
    this._model = model;
    this._setupHtml();
  }

  bindSelectionChanged(handler) {
    this._notifySelectionChanged = handler;
  }

  updateSelectedTile() {
    if (this._selectedTile) {
      this._update(this._selectedTile);
    }
  }

  updateAll() {
    this._tiles.forEach((tile) => {
      this._update(tile);
    });
    this._selectedTile = null;
  }

  _setupHtml() {
    const root = document.getElementById("root");
    const container = new ElementBuilder("div")
      .setClass("game-container")
      .appendTo(root)
      .addListener("click", this._tileSelected.bind(this))
      .getResult();
    for (let i = 0; i < this._tiles.length; i++) {
      this._tiles[i] = new ElementBuilder("div")
        .setClass("tile")
        .setText("")
        .appendTo(container)
        .getResult();
    }
    const side = this._model.side;
    container.style.gridTemplateColumns = `repeat(${side}, 1fr)`;
  }

  _tileSelected(event) {
    const selectedTile = event.target;
    if (!selectedTile.classList.contains("tile")) {
      return;
    }

    this._selectedTile = selectedTile;

    if (this._notifySelectionChanged) {
      const index = this._indexOf(this._selectedTile);
      this._notifySelectionChanged(index);
    }
  }

  _update(tile) {
    const index = this._indexOf(tile);
    const value = this._model.readCell(index);
    tile.textContent = value;
    tile.style.color =
      value === "." ? "transparent" : value === "X" ? "red" : "blue";
  }

  _indexOf(tile) {
    return this._tiles.indexOf(tile);
  }
}

/**
 * Spielfeld mit Spielstand
 */
export class View {
  constructor(model) {
    this._model = model;
    this._board = new Board(model);
    this._board.updateAll();
    this._dialog = new ModalDialog();
    this._fullScreen = new FullScreen();
    this._lockScreen = new LockScreen();
    this._ressources = {
      click: new Audio("resources/click.mp3"),
      clack: new Audio("resources/clack.mp3"),
      wrong: new Audio("resources/buzz.mp3"),
      bell: new Audio("resources/success.mp3"),
      draw: new Audio("resources/draw.mp3"),
    };
  }

  mainloop() {}

  bindSelectionChanged(handler) {
    this._board.bindSelectionChanged(handler);
  }

  wrongMove() {
    this._playSound("wrong");
  }

  updateBoard() {
    this._playSound(this._model.player === "X" ? "click" : "clack");
    this._board.updateSelectedTile();
  }

  gameIsWon() {
    this._playSound("bell");
    this._showAlert(`Spieler ${this._model.player} gewinnt!`, () => {
      this._model.resetCells();
      this._board.updateAll();
    });
  }

  gameIsDraw() {
    this._playSound("draw");
    this._showAlert("Unentschieden!", () => {
      this._model.resetCells();
      this._board.updateAll();
    });
  }

  _showAlert(message, performAfterHiding) {
    this._dialog.showAlert(message, performAfterHiding);
  }

  _playSound(key) {
    if (key in this._ressources) {
      this._ressources[key].play();
    }
  }
}
