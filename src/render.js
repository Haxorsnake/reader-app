const { ipcRenderer } = require("electron/renderer");

const bookArea = document.getElementById("EpubArea").firstElementChild;
const epubStore = ipcRenderer.invoke("getEpubStore");

var titleButtons = [...document.getElementById("BarButtons").children];

titleButtons.map((button) => {
	button.onclick = () => {
		ipcRenderer.send(button.id);
	};
});

ipcRenderer.on("window-loaded", async () => {
	let epubs = await epubStore;
	for (const epub in epubs) {
		if (Object.hasOwnProperty.call(epubs, epub)) {
			const element = epubs[epub];
			bookArea.appendChild(await createCard(element.path));
		}
	}
});

class EpubCard extends HTMLElement {
	constructor(titleText, coverSrc, path) {
		super();

		this.titleText = titleText;
		this.coverSrc = coverSrc;
		this.path = path;

		this.setAttribute("class", "hvr-grow");
		this.setAttribute("onclick", "openBook(this.path)");
		this.attachShadow({
			mode: "open",
		});

		const wrapper = document.createElement("span");
		wrapper.setAttribute("class", "wrapper");

		const cover = wrapper.appendChild(document.createElement("img"));
		cover.setAttribute("class", "cardImg");
		cover.src = this.coverSrc ? (cover.src = coverSrc) : (this.cover = "img/default.png");

		const title = wrapper.appendChild(document.createElement("p"));
		title.setAttribute("class", "cardContext");
		title.textContent = titleText;

		const style = document.createElement("link");
		style.setAttribute("rel", "stylesheet");
		style.setAttribute("href", "css/card.css");

		this.shadowRoot.append(style, wrapper);
	}
}

customElements.define("epub-card", EpubCard);

const createCard = async (path) => {
	var book = ePub(path);
	var bookMetadata = await book.loaded.metadata;
	var bookCover = await book.coverUrl();

	const bookCard = new EpubCard(bookMetadata.title, bookCover, path);
	return bookCard;
};

const openBook = async (path) => {
	var book = ePub(path);
	var meta = await book.loaded.metadata;
	ipcRenderer.send("open-reader", path, meta.title);
};

//ADDBOOK
const addBook = () => {
	ipcRenderer.send("open-file-dialog");
};

ipcRenderer.on("file-selected", async (e, path) => {
	var book = ePub(path);
	var meta = await book.loaded.metadata;
	var hasEpub = await ipcRenderer.invoke("hasEpub", meta.title);

	if (!hasEpub) {
		bookArea.appendChild(await createCard(path));
		ipcRenderer.invoke("setEpubValue", meta.title, { path: path });
		console.log("ADDED: " + meta.title);
	} else {
		console.error("EPUB ALREADY ADDED: " + meta.title);
	}
});
