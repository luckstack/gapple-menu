install:
	gnome-extensions pack --extra-source=Resources/ --extra-source=constants.js  --force
	gnome-extensions install gapple-menu@luckstack.shell-extension.zip --force
	rm gapple-menu@luckstack.shell-extension.zip
