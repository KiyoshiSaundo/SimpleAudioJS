;(function() {
	this.SimpleAudioJS = function() {
		this.instances = {};
		this.params = {
			class: 'audio-player',
			html: '<div class="audio-player__buttons">\
	<div class="audio-player__playpause" data-playpause></div>\
	<div class="audio-player__play" data-play></div>\
	<div class="audio-player__pause" data-pause></div>\
	<div class="audio-player__stop" data-stop></div>\
</div>\
<div class="audio-player__track" data-track>\
	<div class="audio-player__track-progress" data-progress-track></div>\
	<div class="audio-player__track-spin" data-progress-spin></div>\
</div>\
<div class="audio-player__times">\
	<div class="audio-player__time-progress" data-progress-time>00:00</div>\
	/\
	<div class="audio-player__time-leave" data-leave-time>00:00</div>\
	/\
	<div class="audio-player__time-total" data-total-time>00:00</div>\
</div>',
			stopOther: true,
			playNext: false
		};
		if (arguments[0] && typeof arguments[0] === "object") {
			this.params = helpers.extendDefaults(this.params, arguments[0]);
		}

		this.instances = init.call(this, this.params);
		this.current = 0;
	};

	SimpleAudioJSItem = function(element, params) {
		var wrapper = element.parentNode;
		this.element = element;
		this.wrapper = wrapper;

		this.time = {
			duration: 0,
			current: 0,
			leave: 0
		};

		this.progressTime = wrapper.querySelector('[data-progress-time]');
		this.leaveTime = wrapper.querySelector('[data-leave-time]');
		this.totalTime = wrapper.querySelector('[data-total-time]');

		this.track = wrapper.querySelector('[data-track]');
		this.progressTrack = wrapper.querySelector('[data-progress-track]');

		this.progressSpin = wrapper.querySelector('[data-progress-spin]');

		this.stopOther = params.stopOther;
		this.playNext = params.playNext;
	};

	SimpleAudioJSItem.prototype = {
		playPause: function() {
			if (this.element.paused) this.element.play();
			else this.element.pause();
		},
		play: function() {
			this.element.play();
		},
		pause: function() {
			this.element.pause();
		},
		stop: function() {
			this.element.pause();
			this.element.currentTime = 0;
			this.pauseHandler(); // need if paused
		},
		ended: function() {
			if (this.playNext) {
				var audioElements = document.getElementsByTagName('audio');
				for (var i = 0, ii = audioElements.length; i < ii; i++) {
					if (audioElements[i] == this.element && audioElements[i+1]) {
						this.stop();
						audioElements[i+1].play();
					}
				}
			}
		},
		playHandler: function() {
			this.pauseOther();
			helpers.addClass(this.wrapper, 'is-played');
			helpers.removeClass(this.wrapper, 'is-paused');
			helpers.removeClass(this.wrapper, 'is-stoped');
		},
		pauseHandler: function() {
			if (this.element.currentTime > 0) {
				helpers.addClass(this.wrapper, 'is-paused');
				helpers.removeClass(this.wrapper, 'is-played');
				helpers.removeClass(this.wrapper, 'is-stoped');
			} else {
				helpers.addClass(this.wrapper, 'is-stoped');
				helpers.removeClass(this.wrapper, 'is-played');
				helpers.removeClass(this.wrapper, 'is-paused');
			}
		},
		playUpdate: function() {
			this.time.current = Math.round(this.element.currentTime);
			this.time.leave = this.time.duration - this.time.current;
			var percent = Math.round((this.time.current / this.time.duration) * 10000) / 100;

			if (this.progressTime) {
				this.progressTime.innerHTML = this.timeToHtml(this.time.current);
			}
			if (this.leaveTime) {
				this.leaveTime.innerHTML = this.timeToHtml(this.time.leave);
			}
			if (this.progressTrack) {
				this.progressTrack.style.width = percent + '%';
			}
			if (this.progressSpin) {
				this.progressSpin.style.left = percent + '%';
			}
		},
		loadedMeta: function() {
			this.time.duration = Math.round(this.element.duration);
			this.time.current = Math.round(this.element.currentTime);
			this.time.leave = this.time.duration - this.time.current;

			if (this.totalTime) {
				this.totalTime.innerHTML = this.timeToHtml(this.time.duration);
			}
			if (this.leaveTime) {
				this.leaveTime.innerHTML = this.timeToHtml(this.time.duration);
			}
		},
		jumpTo: function(e) {
			var cx = Math.round(e.clientX + pageXOffset),
			    trackWidth = parseInt(this.track.clientWidth),
			    trackStart = Math.round(this.track.getBoundingClientRect().left),
			    trackEnd = Math.round(trackStart + trackWidth);

			if (trackStart <= cx && cx <= trackEnd) {
				var p = (cx - trackStart) / trackWidth;
				this.element.currentTime = this.element.duration * p;
			}
		},
		trackScroll: function(e) {
			var cx = Math.round(e.clientX + pageXOffset),
			    trackWidth = parseInt(this.track.clientWidth),
			    trackStart = Math.round(this.track.getBoundingClientRect().left),
			    trackEnd = Math.round(trackStart + trackWidth);

			var th = this;

			function procDragDrop(e) {
				var p = (Math.round(e.clientX + pageXOffset) - trackStart) / trackWidth;
				if (p <= 0) p = 0;
				if (p >= 100) p = 100;
				th.element.currentTime = th.element.duration * p;
			}

			document.onselectstart = function() { return false; };
			document.ondragstart = function() { return false; };
			document.addEventListener('mousemove', procDragDrop);

			document.onmouseup = function() {
				document.onselectstart = null;
				document.ondragstart = null;
				document.removeEventListener('mousemove', procDragDrop);
			};
		},
		// helpers
		pauseOther: function() {
			if (this.stopOther) {
				var audioElements = document.getElementsByTagName('audio');
				for (var i = 0, ii = audioElements.length; i < ii; i++) {
					if (audioElements[i] != this.element) {
						audioElements[i].pause();
					}
				}
			}
		},
		timeToHtml: function(time) {
			var m = Math.floor(time / 60),
			    s = Math.floor(time % 60);
			return ((m<10?'0':'')+m+':'+(s<10?'0':'')+s);
		}
	};

	function init(params) {
		var instances = {};
		var audioElements = document.getElementsByTagName('audio');
		for (var i = 0, ii = audioElements.length; i < ii; i++) {
			instances[i] = newInstance(audioElements[i], params);
		}
		return instances;
	}

	function newInstance(audio, params) {
		audio = createPlayer(audio, params);
		audio = new SimpleAudioJSItem(audio, params);
		attachEvents(audio, params);
		return audio;
	}

	function createPlayer(audio, params) {
		var wrapper = document.createElement('div'),
			newAudio = audio.cloneNode(true);

		wrapper.setAttribute('class', params.class);
		wrapper.appendChild(newAudio);
		wrapper.innerHTML += params.html;

		audio.parentNode.replaceChild(wrapper, audio);

		return wrapper.getElementsByTagName('audio')[0];
	}

	function attachEvents(audio, params) {
		// play-pause btn
		var btnPlayPause = audio.wrapper.querySelector('[data-playpause]');
		if (btnPlayPause) {
			btnPlayPause.addEventListener('click', function(e) {
				audio.playPause.call(audio);
			});
		}
		// play btn
		var btnPlay = audio.wrapper.querySelector('[data-play]');
		if (btnPlay) {
			btnPlay.addEventListener('click', function(e) {
				audio.play.call(audio);
			});
		}
		// pause btn
		var btnPause = audio.wrapper.querySelector('[data-pause]');
		if (btnPause) {
			btnPause.addEventListener('click', function(e) {
				audio.pause.call(audio);
			});
		}
		// stop btn
		var btnStop = audio.wrapper.querySelector('[data-stop]');
		if (btnStop) {
			btnStop.addEventListener('click', function(e) {
				audio.stop.call(audio);
			});
		}
		// jumpTo
		var track = audio.wrapper.querySelector('[data-track]');
		if (track) {
			track.addEventListener('mouseup', function(e) {
				audio.jumpTo.call(audio, e);
			});
			track.addEventListener('mousedown', function(e) {
				audio.trackScroll.call(audio, e);
			});
		}
		// playing
		audio.element.addEventListener('timeupdate', function(e) {
			audio.playUpdate.call(audio);
		});
		// loaded
		audio.element.addEventListener('loadedmetadata', function(e) {
			audio.loadedMeta.call(audio);
		});
		// play handler
		audio.element.addEventListener('play', function(e) {
			audio.playHandler.call(audio);
		});
		// pause handler
		audio.element.addEventListener('pause', function(e) {
			audio.pauseHandler.call(audio);
		});
		audio.wrapper.addEventListener('dragstart', function(e) {
			return false;
		});
		audio.element.addEventListener('ended', function(e) {
			audio.ended.call(audio);
		});
	}

	/* helpers */

	var helpers = {
		extendDefaults: function(source, properties) {
			var property;
			for (property in properties) {
				if (properties.hasOwnProperty(property)) {
					source[property] = properties[property];
				}
			}
			return source;
		},
		addClass: function(element, cclass) {
			if ( !helpers.hasClass(element, cclass) ) {
				element.className += ' '+cclass;
			}
		},
		removeClass: function(element, cclass) {
			if ( helpers.hasClass(element, cclass) ) {
				var has = new RegExp(cclass, "g");
				element.className = element.className.replace(has, '');
				element.className = element.className.replace(/\ {2,}/g, ' ');
			}
		},
		hasClass: function(element, cclass) {
			var has = new RegExp(cclass, "g");
			if (element.className.match(has)) return true;
			else return false;
		},
	};
}());