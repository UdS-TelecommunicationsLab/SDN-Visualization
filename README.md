﻿# SDN-Visualization

Software Defined Networks monitoring and visualization system.

**Authors:** [Andreas Schmidt](mailto:schmidt@nt.uni-saarland.de), [Philipp S. Tennigkeit](mailto:tennigkeit@intel-vci.uni-saarland.de), [Michael Karl](mailto:karl@nt.uni-saarland.de)

**Website:** [OpenNetworking @ Saarland University](http://www.opennetworking.uni-saarland.de/)

**Institution:** [Telecommuncations Chair](http://www.nt.uni-saarland.de/) - [Saarland University](http://www.uni-saarland.de/)

**Version:** 2015.8.0

## Installation Guide

The next few simple steps will guide you through the installation process. Typically this takes about five to ten minutes.

We assume the sources are extracted and reside in the folder `<project root>`. We recommend putting the sources in a subdirectory of `/opt`, but this depends on your setup.

### Platform Compatibility
The software is regularly tested on a *Windows 8.1*, *Windows 10*, *Mac OS X 10.10.3*, *Ubuntu 14.04*, *Fedora 20*, *Fedora 21* and *Fedora 22*.
Other operating systems might require different steps than these mentioned here.

It is compatible with most modern browsers (e.g. Chrome >=30, Firefox >=25, Internet Explorer >=11, Opera >=17, Edge).

### Prerequisites

	* git
	* openssl
	* nodejs 0.10.20 or newer
	* npm 1.3.11 or newer

These can be installed via your package manager (Linux, e.g. apt-get) or via an installer (Windows).
	* At first, Git needs to be installed. On Linux based operating systems you may want use your package manager or compile from source.
	  Using windows based machines, the easiest way is to install git from [git-scm.com](https://git-scm.com/).
	* To make use of [OpenSSL](https://www.openssl.org/related/binaries.html) on Windows [tbs-certificates.co.uk](https://www.tbs-certificates.co.uk/FAQ/en/openssl-windows.html) provides a guide how to install and configure OpenSSL.

In order to have `gulp` and `bower` as command line utilities, you have to enter the following: `npm install -g gulp bower`

### Setup Process
Install Node.js packages, bower packages as well as build the JavaScript sources. This works similar for Windows, Linux-like and Mac systems:

    cd <project root>
    npm install
    bower install
    gulp

#### Creating an SSL certificate
As this program is using HTTPS for secure communication, you are required to use a certificate. This can be an official, commercial one or a self signed.
Go to your project folder and create a new directory named `cert`.

**Linux**

	cd <project root>
	mkdir cert
	cd cert

**Windows**

	cd <project root>
	md cert
	cd cert

Now, either paste your own certificate into the folder or create a self-signed one using the following steps (remember to have OpenSSL installed):

**Linux**

	openssl genrsa -out key.pem 1024
	openssl req -new -x509 -key key.pem -out cert.pem -days 730

**Windows**

The Path depends on your system architecture and your personal configuration:

	C:\OpenSSL-Win64\bin\openssl.exe genrsa -out key.pem 1024
	C:\OpenSSL-Win64\bin\openssl.exe req -new -x509 -key key.pem -out cert.pem -days 730

Afterwards enter your organizations details and this should leave you with the files `key.pem` and `cert.pem` in `<project root>/cert`.

### Configuration

Before starting the application, the `sdn-conf.json` has to be in place. The easiest way is to copy the existing `sdn-conf.default.json` to `sdn-conf.json` and adapt the values to the application's needs. Therefore the following parameters can be modified:

* `appPort`: usually set to 443, to allow HTTPS communication on the well-known port. For using the well-known ports such as 443 (https) and 80 (http) you may need to run this application with administration rights (root).
* `credentials`: the web interface is secured by a simple name/password check without any sophisticated user management. Therefore one can specify these parameters here. **THE DEFAULT VALUES SHOULD BE CHANGED FOR "PRODUCTIVE" SETUPS**
* `isHttpRedirectEnabled`: this can be set to false, when the normal port 80 should not be used for redirecting to the SSL encrypted instance of the application.
* `isDemoMode`: this can be set to true, in order to disable controls for changing connection string and controller type on the configuration page. In this mode, the credentials are shown on the login page for easier access.
* `operatorUrl`: specify a URL of the institution that operates the visualization.

Remember that you might need to configure your firewall.

#### Operator Logo and Link

You might also want to change the logo at `<project root>/public/images/OperatorLogo.png`. It should be a PNG file with 150 x 130 px and consist of two rows. The upper row contains the image in saturated version and the lower in an desaturated version. Ensure that the images are properly aligned, so that the visual effect behaves properly. The link's target can be changed as specified above.

### Starting

There are two common options for running the application. In either case there will be an application running under `localhost:appPort`.

#### Foreground

**Linux**

	cd <project root>
	sudo /usr/bin/nodejs main.js

**Windows**

	cd <project root>
	node main.js

#### Background

##### Backgroud Task

**Linux**

	cd <project root>
	sudo nohup /usr/bin/nodejs main.js > output.log &

##### Upstart Script
The package includes the file `sdn-viz.conf`, which is a prepared for copying it into `/etc/init/`. It requires the npm package `forever` to be installed globally, which can be done via `npm install -g forever`.

The only required modification to the file is the directory (`<project root>`), which you have to specify. The respective line contains a `TODO` comment. You might also consider to change the logs output.


## Configuration

As soon as the application is running, the connection to the controller has to be configured. This can be done on the website's *Configuration* page. The minimal setup includes an IP and port for the controller's API endpoint.

It is also recommended to specify a controller name and contact mail address.

The main section (Node Information) is later used to augment individual devices and groups of those with additional information (type, color, URL, location and purpose).

## Modifying Code

### Client
The code for client-side is concatenated and uglified using gulp. The package comes with a compiled version of the latest code (`/public/dist.min.js`). If you change anything, you have to execute `gulp` in the `<project root>`.

In order to have `gulp` as a command line utility you have to enter the following:

`sudo npm install -g gulp`

### Server

The code on the server side can be changed at any time. As *Node.js* is requiring subpackages only once, a restart of the application might be necessary.

## Questions?

Please send us feedback via [email](mailto:info@openflow.uni-saarland.de) on any problems you might encounter during installation and operation that are not covered here. The software and documentation are under constant development and improvements are highly appreciated. If you have any questions do not hesitate to ask them.

## FAQ

### I get a EADDRINUSE error when starting the application. What should I do?

This is most likely due to a running webserver on the current system that binds port 80. This can be fixed by setting the isHttpRedirectEnabled flag to false or by disabling the other service, e.g. apache, which binds port 80.

### I make changes to the application code and nothing happens.

Remember to run ``gulp`` whenever you change frontend code and to restart the nodejs server, whenever the backend code is changed.

## Resources

* [Open Networking Foundation](https://www.opennetworking.org/)
* [OpenFlow Specification](https://www.opennetworking.org/sdn-resources/onf-specifications/openflow)
