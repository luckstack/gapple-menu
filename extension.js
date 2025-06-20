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
const Selection = Me.imports.selection;

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
	Util.spawn(['gnome-session-quit', '--reboot'])
}

function _shutdown() {
	Util.spawn(['gnome-session-quit', '--power-off'])
}

function _lockScreen() {
	Util.spawn(['loginctl', 'lock-session'])
}

function _logOut() {
	Util.spawn(['gnome-session-quit', '--logout'])
}

function _forceQuit() {
	new Selection.SelectionWindow();
}

var MenuButton = GObject.registerClass(class GappleMenu_MenuButton extends PanelMenu.Button {
	_init() {
		super._init(0.0, "MenuButton");
		this._settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);

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
		this._settings.connect('changed::hide-softwarecentre', () => this.toggleOptions())
		this._settings.connect('changed::show-power-options', () => this.toggleOptions())
		this._settings.connect('changed::hide-forcequit', () => this.toggleOptions())
		this._settings.connect('changed::show-lockscreen', () => this.toggleOptions())
		this.toggleOptions();

	}

	toggleOptions(){
		let poweroption_state = this._settings.get_boolean('show-power-options')
		let forcequit_state = this._settings.get_boolean('hide-forcequit')
		let lockscreen_state = this._settings.get_boolean('show-lockscreen')
		let softwarecenter_state = this._settings.get_boolean('hide-softwarecentre')
		this.menu.removeAll()
		this.item1 = new PopupMenu.PopupMenuItem(_('About My System'))
		this.item2 = new PopupMenu.PopupMenuItem(_('System Settings...'))
		this.item3 = new PopupMenu.PopupSeparatorMenuItem()
		this.item4 = new PopupMenu.PopupSeparatorMenuItem()

		this.item1.connect('activate', () => _aboutThisDistro())
		this.item2.connect('activate', () => _systemSettings())
		this.item3.connect('activate', () => _overviewToggle())

		this.menu.addMenuItem(this.item1)
		this.menu.addMenuItem(this.item2)
		this.menu.addMenuItem(this.item3)
		this.menu.addMenuItem(this.item4)
		this.menu.addMenuItem(this.item5)
		this.menu.addMenuItem(this.item6)

		if (!softwarecenter_state) {
			this.item7 = new PopupMenu.PopupMenuItem(_('App Store...'))
            this.item7.connect('activate', () => this.softwareStore())
			this.menu.addMenuItem(this.item7)
        }

		this.menu.addMenuItem(this.item8)
		this.menu.addMenuItem(this.item9)
		this.menu.addMenuItem(this.item10)

		if(!forcequit_state) {
			this.item11 = new PopupMenu.PopupSeparatorMenuItem()
			this.menu.addMenuItem(this.item11)
			this.item12 = new PopupMenu.PopupMenuItem(_('Force Quit App'))
			this.item12.connect('activate', () => _forceQuit())
			this.menu.addMenuItem(this.item12)
		}

		if (poweroption_state) {
			this.item13 = new PopupMenu.PopupSeparatorMenuItem()
			this.item14 = new PopupMenu.PopupMenuItem(_('Sleep'))
			this.item15 = new PopupMenu.PopupMenuItem(_('Restart...'))
			this.item16 = new PopupMenu.PopupMenuItem(_('Shut Down...'))
			this.item17 = new PopupMenu.PopupSeparatorMenuItem()
			if (lockscreen_state)
				this.item18 = new PopupMenu.PopupMenuItem(_('Lock Screen'))
			this.item18 = new PopupMenu.PopupMenuItem(_('Log Out...'))

			this.menu.addMenuItem(this.item13)
			this.menu.addMenuItem(this.item14)
			this.menu.addMenuItem(this.item15)
			this.menu.addMenuItem(this.item16)
			this.menu.addMenuItem(this.item17)
			if (lockscreen_state) {
				this.menu.addMenuItem(this.item18)
				this.item18.connect('activate', () => _lockScreen())
			}
			this.menu.addMenuItem(this.item18)

			this.item14.connect('activate', () => _sleep())
			this.item15.connect('activate', () => _restart())
			this.item16.connect('activate', () => _shutdown())
			this.item18.connect('activate', () => _logOut())
		}

		else if (!poweroption_state && lockscreen_state) {
			this.item17 = new PopupMenu.PopupSeparatorMenuItem()
			this.item18 = new PopupMenu.PopupMenuItem(_('Lock Screen'))

			this.menu.addMenuItem(this.item17)
			this.menu.addMenuItem(this.item18)

			this.item18.connect('activate', () => _lockScreen())
		}
	}

	softwareStore() {
		Util.trySpawnCommandLine(this._settings.get_string('menu-button-software-center'))
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
