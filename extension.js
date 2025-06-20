import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';

import * as Constants from './constants.js';
import * as Selection from './selection.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const MenuItem = GObject.registerClass(
class GappleMenuMenuItem extends PopupMenu.PopupMenuItem {
    _init(name, activateFunction) {
        super._init(name);
        this.connect('activate', () => activateFunction());
    }
});

const MenuButton = GObject.registerClass(
class GappleMenuMenuButton extends PanelMenu.Button {
    _init(extension) {
        super._init(0.5, 'GappleMenu');
        this._extension = extension;
        this._settings = extension.getSettings();

        // Icon
        this.icon = new St.Icon({
           style_class: 'menu-button',
        });
        
        this._settings.connectObject('changed::hide-icon-shadow', () => this.hideIconShadow(), this);
        this._settings.connectObject('changed::menu-button-icon-image', () => this.setIconImage(), this);
        this._settings.connectObject('changed::symbolic-icon', () => this.setIconImage(), this);
        this._settings.connectObject('changed::use-custom-icon', () => this.setIconImage(), this);
        this._settings.connectObject('changed::custom-icon-path', () => this.setIconImage(), this);
        this._settings.connectObject('changed::menu-button-icon-size', () => this.setIconSize(), this);
	
	this.hideIconShadow();
        this.setIconImage();
        this.setIconSize();
        this.add_child(this.icon);

        // Menu
        this._settings.connectObject('changed::hide-softwarecentre', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::show-power-options', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::hide-forcequit', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::show-lockscreen', () => this._displayMenuItems(), this);

        this._displayMenuItems();

        // bind middle click option to toggle overview
        this.connect('button-press-event', this._buttonPressEvent.bind(this));
    }

    _addItem(item) {
        this.menu.addMenuItem(item);
    }

    _displayMenuItems() {
        const showPowerOptions = this._settings.get_boolean('show-power-options');
        const showForceQuit = !this._settings.get_boolean('hide-forcequit');
        const showLockScreen = this._settings.get_boolean('show-lockscreen');
        const showSoftwareCenter = !this._settings.get_boolean('hide-softwarecentre');

        this.menu.removeAll();

        this._addItem(new MenuItem(_('About My System'), () => this._aboutThisDistro()));
        // this._addItem(new MenuItem(_('System Settings...'), () => this._systemPreferences()));
        this._addItem(new PopupMenu.PopupSeparatorMenuItem());

	if (systemSettings)
	    this._addItem(new MenuItem(_('System Settings...'), () => this._systemSettings()));

        if (showSoftwareCenter)
            this._addItem(new MenuItem(_('App Store...'), () => this._openSoftwareCenter()));

        if (showForceQuit) {
            this._addItem(new PopupMenu.PopupSeparatorMenuItem());
            this._addItem(new MenuItem(_('Force Quit...'), () => this._forceQuit()));
        }

        if (showPowerOptions) {
            this._addItem(new PopupMenu.PopupSeparatorMenuItem());
            this._addItem(new MenuItem(_('Sleep'), () => this._sleep()));
            this._addItem(new MenuItem(_('Restart...'), () => this._restart()));
            this._addItem(new MenuItem(_('Shut Down...'), () => this._shutdown()));
            this._addItem(new PopupMenu.PopupSeparatorMenuItem());

            if (showLockScreen)
                this._addItem(new MenuItem(_('Lock Screen'), () => this._lockScreen()));

            this._addItem(new MenuItem(_('Log Out...'), () => this._logOut()));
        } else if (!showPowerOptions && showLockScreen) {
            this._addItem(new PopupMenu.PopupSeparatorMenuItem());
            this._addItem(new MenuItem(_('Lock Screen'), () => this._lockScreen()));
        }
    }

    _buttonPressEvent(actor, event) {
        // left click === 1, middle click === 2, right click === 3
        const clickType = this._settings.get_int('menu-button-icon-click-type');
        if (event.get_button() === clickType) {
            this.menu.close();
            Main.overview.toggle();
        }
    }

    _aboutThisDistro() {
        const gnomeMajorVersion = parseInt(Config.PACKAGE_VERSION.toString().split('.')[0]);
        if (gnomeMajorVersion >= 46) {
            Util.spawn(['gnome-control-center', 'system', 'about']);
        } else {
            Util.spawn(['gnome-control-center', 'info-overview']);
        }
    }

	_systemSettings() {
        const gnomeMajorVersion = parseInt(Config.PACKAGE_VERSION.toString().split('.')[0]);
        if (gnomeMajorVersion >= 46) {
            Util.spawn(['gnome-control-center']);
        } else {
            Util.spawn(['gnome-control-center']);
        }
    }

    _systemPreferences() {
        Util.spawn(['gnome-control-center']);
    }

    _overviewToggle() {
        Main.overview.toggle();
    }

    _sleep() {
        Util.spawn(['systemctl', 'suspend']);
    }

    _restart() {
        Util.spawn(['gnome-session-quit', '--reboot']);
    }

    _shutdown() {
        Util.spawn(['gnome-session-quit', '--power-off']);
    }

    _lockScreen() {
        Util.spawn(['loginctl', 'lock-session']);
    }

    _logOut() {
        Util.spawn(['gnome-session-quit', '--logout']);
    }

    _forceQuit() {
        new Selection.SelectionWindow();
    }

    _openSoftwareCenter() {
        Util.trySpawnCommandLine(this._settings.get_string('menu-button-software-center'));
    }

    setIconImage() {
        const iconIndex = this._settings.get_int('menu-button-icon-image');
        const isSymbolic = this._settings.get_boolean('symbolic-icon');
        const useCustomIcon = this._settings.get_boolean('use-custom-icon');
        const customIconPath = this._settings.get_string('custom-icon-path');
        let isStartHereSymbolic = false;
        let iconPath;
        let notFound = false;

        if (useCustomIcon && customIconPath !== '') {
            iconPath = customIconPath;
        } else if (isSymbolic) {
            if (Constants.SymbolicDistroIcons[iconIndex] !== undefined) {
                isStartHereSymbolic = Constants.SymbolicDistroIcons[iconIndex].PATH === 'start-here-symbolic';
                iconPath = this._extension.path + Constants.SymbolicDistroIcons[iconIndex].PATH;
            } else {
                notFound = true;
            }
        } else {
            if (Constants.ColouredDistroIcons[iconIndex] !== undefined) {
                iconPath = this._extension.path + Constants.ColouredDistroIcons[iconIndex].PATH;
            } else {
                notFound = true;
            }
        }

        if (notFound) {
            iconPath = 'start-here-symbolic';
            this._settings.set_boolean('symbolic-icon', true);
            this._settings.set_int('menu-button-icon-image', 0);
        }

        const fileExists = GLib.file_test(iconPath, GLib.FileTest.IS_REGULAR);

        const icon = isStartHereSymbolic || !fileExists ? 'start-here-symbolic' : iconPath;

        this.icon.gicon = Gio.icon_new_for_string(icon);
    }
    setIconSize() {
        const iconSize = this._settings.get_int('menu-button-icon-size');
        this.icon.icon_size = iconSize;
    }
    
    hideIconShadow() {
    	const iconShadow = this._settings.get_boolean('hide-icon-shadow');
    	
        if(!iconShadow){
            this.icon.add_style_class_name('system-status-icon'); 
        } else {
            this.icon.remove_style_class_name('system-status-icon');
        }
    }
});
