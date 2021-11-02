const { ipcRenderer } = require("electron/renderer");
const { Book, Rendition } = require("./res/epubjs");
const rpath = require("path");
var currentChapter;
var titleButtons = [...document.getElementById("BarButtons").children];

titleButtons.map((button) => {
	button.onclick = () => {
		ipcRenderer.send(button.id);
	};
});

ipcRenderer.on("reader-open", (e, path) => {
	loadBook(path);
});

const loadBook = async (path) => {
	var book = new Book(path);
	var rendition = new Rendition(book, {
		flow: "scrolled-doc",
		script: rpath.join(__dirname, "readerTest.js"),
	});

	var meta = await book.loaded.metadata;
	var hasChapter = await ipcRenderer.invoke("hasChapter", meta.title);
	var chapterData = await ipcRenderer.invoke("getChapterValue", meta.title);

	console.log(hasChapter);
	rendition.themes.register("./css/chapter.css");
	rendition.attachTo(document.getElementById("Reader"));

	if (hasChapter) {
		currentChapter = chapterData.chapter;
		rendition.display(chapterData.chapter);
	} else {
		rendition.display(0);
	}

	const keyListener = (e) => {
		// Left Key
		if ((e.keyCode || e.which) == 37) {
			book.loaded.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
			currentChapter = rendition.currentLocation().start.index - 1;
		}

		// Right Key
		if ((e.keyCode || e.which) == 39) {
			book.loaded.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
			currentChapter = rendition.currentLocation().start.index + 1;
		}

		console.log(currentChapter);
	};

	rendition.on("keyup", keyListener);
	document.addEventListener("keyup", keyListener, false);
};

ipcRenderer.on("reader-closed", (e, title) => {
	ipcRenderer.invoke("setChapterValue", title, { chapter: currentChapter });
});
