var pinchStartGap = 0;
var fontSize = 62.5;

window.addEventListener("load", displayFileList);
window.addEventListener("touchstart", pinch);
window.addEventListener("touchmove", pinch);

function pinch(evt) {
	var touches = evt.touches;

	if (touches.length !== 2) {
		return;
	};

	evt.preventDefault();
	var x1 = touches[0].screenX / window.screen.width;
	var y1 = touches[0].screenY / window.screen.height;
	var x2 = touches[1].screenX / window.screen.width;
	var y2 = touches[1].screenY / window.screen.height;
	var pinchGap = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
	
	if (evt.type === "touchstart") {
		pinchStartGap = pinchGap;
	} else {
		fontSize += (pinchGap - pinchStartGap) * 5;
		if (fontSize > 125) {
			fontSize = 125;
		} else if (fontSize < 30) {
			fontSize = 30;
		} else {
			document.getElementsByTagName("html")[0].style.fontSize = fontSize + "%";
		};
	};
};	


function displaySong(fileContent) {

	// Search chords (between brackets) and directives (between curly braces)
	var reChords = /\[[^\]]*\]/g;
	var reDirectives = /\{([^\}]*)\}/;

	var aLines = fileContent.split("\n");

	var h1 = document.getElementById("title");
	var h2 = document.getElementById("subtitle");
	var sectionSong = document.getElementById("song");
	var sectionSongSheet = document.getElementById("songsheet");
	var sectionSongList = document.getElementById("songlist");
	
	document.body.removeChild(sectionSongList);

	// Loop on each line of the file
	for (i = 0; i < aLines.length; i++) {
		
		// Lines with chords		
		if (reChords.test(aLines[i])) {

			var table = document.createElement("table");
			var trChords = document.createElement("tr");
			var trLyrics = document.createElement("tr");
			sectionSong.appendChild(table);
			table.appendChild(trChords);
			table.appendChild(trLyrics);
			
			var aChords = aLines[i].match(reChords);
			var aLyrics = aLines[i].split(reChords);
			
			// If the line begins with a chord, we delete the empty string at the begining of aLyrics
			if (aLines[i].charAt(0) === "[") {
				aLyrics.shift();
			// If the line begins with lyrics, we create an empty string at the begining of aChords (to have an empty td)
			} else {
				aChords.unshift("");
			};
			
			for (j = 0; j < aChords.length; j++) {

				// Chords row
				var tdChords = document.createElement("td");
				tdChords.textContent = aChords[j].substring(1, aChords[j].length - 1);
				tdChords.setAttribute("class", "chord");
				trChords.appendChild(tdChords);
				
				// Lyrics row
				var tdLyrics = document.createElement("td");
				tdLyrics.textContent = aLyrics[j];
				trLyrics.appendChild(tdLyrics);
			};
					
		// Lines with directives between curly braces	
		} else if (reDirectives.test(aLines[i])) {
			
			var aDirective = reDirectives.exec(aLines[i]);
		
			if (aDirective[1].substr(0,2) === "t:") {
				
				h1.textContent = aDirective[1].replace("t:","");
				
			} else if (aDirective[1].substr(0,3) === "st:") {
				
				h2.textContent = aDirective[1].replace("st:","");
			};
			
		// Other lines
		} else {
			var p = document.createElement("p");
			sectionSong.appendChild(p);
			p.textContent = aLines[i];
		};
	};
	
	sectionSongSheet.style.display = "block";
	window.navigator.requestWakeLock('screen');
};


var fileValidation = function(file) {
		
	var isValid = false;
	var msg = "";
	
	if (!file) {

	// Check file extension
	} else if (file.name.search(/\.(txt|crd|cho|chopro|chordpro)$/i) === -1) {
		var msg = "The file should have one of these extensions : txt, crd, cho, chopro, chordpro.";
	} else if (file.size > 500000) {
		var msg = "The selected file is too big (> 500 KB).";
	} else {
		isValid = true;
	};
	return [isValid, msg];
};


function openFile(file) {
	var reader = new FileReader();
	reader.onload = function () {
		var fileContent = reader.result;
		displaySong(fileContent);
	};
	reader.readAsText(file);
}


function displayFileList () {
	
	var ul = document.getElementById("file_list");
	var sdcard = navigator.getDeviceStorage("sdcard");
	// Browse all the files available in the songsheets folder
	var cursor = sdcard.enumerate("songsheets");
		
	cursor.onsuccess = function () {
		
		var file = this.result;
		
		// Check file and put the file name in a list
		if (fileValidation(file)[0]) {
			var li = document.createElement("li");
			var a = document.createElement("a");

			a.textContent = file.name.match(/[^/]+$/);
			a.onclick = function () {
				openFile(file);
			};
			a.setAttribute("href", "#");
			ul.appendChild(li);
			li.appendChild(a);
		};

		// Once we found a file we check if there is other results
	 	if (!this.done) {
			// Then we move to the next result, which call the cursor
			// success with the next file as result.
	 		this.continue();
	 		
	 	} else if (!ul.hasChildNodes()) {
			noFileFound();
		};
	};
	
	cursor.onerror = noFileFound;
	
	function noFileFound () {
		
		var sectionSongList = document.getElementById("songlist");
		var p = document.createElement("p");
		var a = document.createElement("a");
		
		sectionSongList.removeChild(ul);
		p.textContent = "No file found. Check that you have a 'songsheets' folder with ChordPro files (*.txt, *.crd, *.cho, *.chopro, *.chordpro).";
		a.setAttribute("href", "index.html");
		a.setAttribute("id", "reload");
		a.textContent = "Reload";
		
		sectionSongList.appendChild(p);
		sectionSongList.appendChild(a);		
	}
}
