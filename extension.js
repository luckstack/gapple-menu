// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {Gio, GLib, GObject, Shell, St} = imports.gi;
const Constants = Me.imports.constants;
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Util = imports.misc.util

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function _aboutThisDistro() {
	Util.spawn(['gnome-control-center', 'info-overview'])
}

function _systemSettings() {
	Util.spawn(['gnome-control-center'])
}

function _systemPreferences() {
	Util.spawn(['gnome-control-center'])
}

function _overviewToggle() {
	Main.overview.toggle();
}

function _sleep() {
	Util.spawn(['systemctl', 'suspend'])
}

function _restart() {
	Util.spawn(['systemctl', 'reboot'])
}

function _shutdown() {
	Util.spawn(['systemctl', 'poweroff', '-prompt'])
}

function _lockScreen() {
	Util.spawn(['loginctl', 'lock-session'])
}

function _logOut() {
	Util.spawn(['gnome-session-quit'])
}

function _forceQuit() {
	Util.spawn(['xkill'])
}

var MenuButton = GObject.registerClass(class FedoraMenu_MenuButton extends PanelMenu.Button {
	_init() {
		super._init(0.0, "MenuButton");
		this._settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);
		this._system = Main.panel.statusArea.aggregateMenu._system;

		// Icon
		this.icon = new St.Icon({
			style_class: 'menu-button'
		})
		this._settings.connect("changed::menu-button-icon-image", () => this.setIconImage())
		this._settings.connect("changed::menu-button-icon-size", () => this.setIconSize())
		
		this.setIconImage()
		this.setIconSize()
		this.add_actor(this.icon)

		// Menu
		this._settings.connect('changed::show-power-options', () => this.toggleOptions())
		this._settings.connect('changed::hide-forcequit', () => this.toggleOptions())
		this._settings.connect('changed::show-lockscreen', () => this.toggleOptions())
		this._settings.connect('changed::show-lockorientation', () => this.toggleOptions())
		this.toggleOptions();

		//bind middle click option to toggle overview
		this.connect('button-press-event', _middleClick.bind(this));
	}
	
	toggleOptions(){
		let poweroption_state = this._settings.get_boolean('show-power-options')
		let forcequit_state = this._settings.get_boolean('hide-forcequit')
		let lockscreen_state = this._settings.get_boolean('show-lockscreen')
		let lockorientation_state = this._settings.get_boolean('show-lockorientation')
		this.menu.removeAll()
		this.item1 = new PopupMenu.PopupMenuItem(_('About My System                 '))
		this.item2 = new PopupMenu.PopupMenuItem(_('System Settings...'))
		this.item3 = new PopupMenu.PopupSeparatorMenuItem()
		this.item6 = new PopupMenu.PopupSeparatorMenuItem()
		this.item7 = new PopupMenu.PopupMenuItem(_('App Store...'))
		
		this.item1.connect('activate', () => _aboutThisDistro())
		this.item2.connect('activate', () => _systemSettings())
		this.item3.connect('activate', () => _systemPreferences())
		this.item4.connect('activate', () => this.softwareStore())
		
		this.menu.addMenuItem(this.item1)
		this.menu.addMenuItem(this.item2)
		this.menu.addMenuItem(this.item3)
		this.menu.addMenuItem(this.item4)

		if(!forcequit_state) {
			this.item10 = new PopupMenu.PopupSeparatorMenuItem()
			this.menu.addMenuItem(this.item10)
			this.item11 = new PopupMenu.PopupMenuItem(_('Force Quit...'))
			this.item11.connect('activate', () => _forceQuit())
			this.menu.addMenuItem(this.item11)
		}

		if (poweroption_state) {
			this.item12 = new PopupMenu.PopupSeparatorMenuItem()
			this.item13 = new PopupMenu.PopupMenuItem(_('Sleep'))
			this.item14 = new PopupMenu.PopupMenuItem(_('Restart'))
			this.item15 = new PopupMenu.PopupMenuItem(_('Shut Down'))
			this.item16 = new PopupMenu.PopupSeparatorMenuItem()
			if (lockscreen_state) 
				this.item17 = new PopupMenu.PopupMenuItem(_('Lock Screen'))
			this.item18 = new PopupMenu.PopupMenuItem(_('Log Out...'))

			this.menu.addMenuItem(this.item12)
			this.menu.addMenuItem(this.item13)
			this.menu.addMenuItem(this.item14)
			this.menu.addMenuItem(this.item15)
			this.menu.addMenuItem(this.item16)
			if (lockscreen_state) {
				this.menu.addMenuItem(this.item17)
				this.item17.connect('activate', () => _lockScreen())
			}
			this.menu.addMenuItem(this.item18)

			this.item13.connect('activate', () => _sleep())
			this.item14.connect('activate', () => _restart())
			this.item15.connect('activate', () => _shutdown())
			this.item18.connect('activate', () => _logOut())
		}

		else if (!poweroption_state && lockscreen_state) {
			this.item16 = new PopupMenu.PopupSeparatorMenuItem()
			this.item17 = new PopupMenu.PopupMenuItem(_('Lock Screen'))

			this.menu.addMenuItem(this.item16)
			this.menu.addMenuItem(this.item17)

			this.item17.connect('activate', () => _lockScreen())
		}

		if (lockorientation_state) {
			this.item19 = new PopupMenu.PopupSeparatorMenuItem()
			this.item20 = new PopupMenu.PopupMenuItem(_('Lock Orientation'))

			this.menu.addMenuItem(this.item19)
			this.menu.addMenuItem(this.item20)

			this.item20.connect("activate", () => this._system._systemActions.activateLockOrientation())
		}
	}

	softwareStore() {
		Util.spawn([this._settings.get_string('menu-button-software-center')])
	}

	setIconImage(){
		let iconIndex = this._settings.get_int('menu-button-icon-image');
		let path = Me.path + Constants.DistroIcons[iconIndex].PATH;
		if(Constants.DistroIcons[iconIndex].PATH === 'start-here-symbolic')
			path = 'start-here-symbolic';
		else if(!GLib.file_test(path, GLib.FileTest.IS_REGULAR))
			path = 'start-here-symbolic';  
		this.icon.gicon = Gio.icon_new_for_string(path);
	}

	setIconSize(){
		let iconSize = this._settings.get_int('menu-button-icon-size');
		this.icon.icon_size = iconSize;
	}
})

function init() {
	ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
}
 
function enable() {
	const activitiesButton = Main.panel.statusArea['activities']
	if (activitiesButton) {
		activitiesButton.container.hide()
	}

	let indicator = new MenuButton()
	Main.panel.addToStatusArea('menuButton', indicator, 0, 'left')

	// hide
	Main.panel.statusArea['menuButton'].visible = false

	// change icon
	//Main.panel.statusArea['menuButton'].icon.icon_name = "appointment-soon-symbolic"

	// show
	Main.panel.statusArea['menuButton'].visible = true
}
 
function disable() {
	const activitiesButton = Main.panel.statusArea['activities']
	if (activitiesButton) {
		activitiesButton.container.show()
	}

	Main.panel.statusArea['menuButton'].destroy()
}
