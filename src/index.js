const { app, BrowserWindow, dialog } = require('electron');
const { ipcMain } = require('electron/main');
const Store = require('electron-store');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}
const epubStore = new Store({
	name: 'epubs'
})

const chapterStore = new Store({
	name: 'chapterdata'
})

//CHAPTER HANDLES
ipcMain.handle('getChapterStore', (e) => {
	return chapterStore.store;
})

ipcMain.handle('getChapterValue', (e, key) => {
	return chapterStore.get(key);
})

ipcMain.handle('setChapterValue', (e, key, val) => {
	chapterStore.set(key, val)
})


ipcMain.handle('hasChapter', (e, key) => {
	return chapterStore.has(key);
})

//EPUB HANLDES
ipcMain.handle('getEpubStore', (e) => {
	return epubStore.store;
})

ipcMain.handle('getEpubValue', (e, key) => {
	return epubStore.get(key);
})

ipcMain.handle('setEpubValue', (e, key, val) => {
	epubStore.set(key, val)
})

ipcMain.handle('hasEpub', (e, key) => {
	return epubStore.has(key);
})


//Create Main Window
const createWindow = () => {
  	const mainWindow = new BrowserWindow({
		width: 1500,
		height: 800,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	});

  	mainWindow.loadFile(path.join(__dirname, 'index.html'));
  	mainWindow.webContents.openDevTools();

	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.webContents.send('window-loaded')
	})
};

//IPC
ipcMain.on('window-minimize', () => {
  	BrowserWindow.getFocusedWindow().minimize();
})

ipcMain.on('window-maximize', () => {
	let currentWindow = BrowserWindow.getFocusedWindow();

	if (currentWindow.isMaximized()) {
		currentWindow.restore();
	} else {
		currentWindow.maximize();
	}
})

ipcMain.on('window-close', () => {
	BrowserWindow.getFocusedWindow().close();
})

ipcMain.on('window-exit', () => {
  	app.quit();
})

ipcMain.on('open-file-dialog', (e) => {
	dialog.showOpenDialog({
		defaultPath: "D:\\Downloads",
		filters: [ { name: 'Books', extensions: ['epub'] } ],
		properties: ['openFile']
	}).then((result) => {
		if(!result.canceled) {
			e.sender.send('file-selected', result.filePaths[0])
		}
	})
})

//IPC Open Reader - Create Reading Window
ipcMain.on('open-reader', (e, path, title) => {
	var reader = new BrowserWindow({
		width: 1200,
		height: 800,
		frame: false,
		title: title,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			nativeWindowOpen: true
		}
	});

	reader.loadFile("src/reader.html");
  	reader.webContents.openDevTools();
	
	reader.webContents.on('did-finish-load', () => {
		reader.webContents.send('reader-open', path)
	})

	reader.on('close', (e) => {
		reader.webContents.send('reader-closed', title);
	})
})

//APP
app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
