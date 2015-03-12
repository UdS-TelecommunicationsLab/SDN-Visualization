# Software Defined Networking - Visualization Application

Providing a web-based interactive visualization solution for *Software-Defined Networks* (in particular *OpenFlow* driven systems).

**Authors:** [Andreas Schmidt](mailto:schmidt@nt.uni-saarland.de), [Michael Karl](mailto:karl@nt.uni-saarland.de)

**Website:** [OpenFlow @ Saarland University](http://www.openflow.uni-saarland.de/)

**Institution:** [Telecommuncations Chair](http://www.nt.uni-saarland.de/) - [Saarland University](http://www.uni-saarland.de/)

**Version:** 2015.1.2

## Installation Guide

The next few simple steps will guide you through the installation process. Typically this takes about five to ten minutes.

We assume the sources are extracted and reside in the folder `<project root>`. We recommend putting the sources in a subdirectory of `/opt`, but this depends on your setup.

### Platform Compatibility
The software is regularly tested on a *Windows 8.1* machine as well as *Ubuntu 14.04*. Other operating systems might require different steps than these mentioned here.

It is compatible with most modern browsers (e.g. Chrome >=30, Firefox >=25, Internet Explorer >=11, Opera >=17).

### Prerequisites

	* nodejs 0.10.20 or newer
	* npm 1.3.11 or newer
	* grunt

These can be installed via your package manager (Linux, e.g. apt-get) or via an installer (Windows).

In order to have `grunt` as a command line utility you have to enter the following: `npm install -g grunt-cli`

### Setup Process
Install Node.js modules as well as build the JavaScript sources:

	cd <project root>
	npm install

#### Creating an SSL certificate
As this program is using HTTPS for secure communication, you are required to use a certificate. This can be an official, commercial one or a self signed.  

	cd <project root>
	mkdir cert
	cd cert

Now, either paste your own certificate into the folder or create a self-signed one using the following steps:

	openssl genrsa -out key.pem 1024
	openssl req -new -x509 -key key.pem -out cert.pem -days 730

Afterwards enter your organizations details and this should leave you with the files `key.pem` and `cert.pem` in `<project root>/cert`.

### Configuration

Before starting the application, the `sdn-conf.json` has to be in place. The easiest way is to copy the existing `sdn-conf.default.json` to `sdn-conf.json` and adapt the values to the application's needs. Therefore the following parameters can be modified:

* `appPort`: usually set to 443, to allow HTTPS communication on the well-known port.
* `credentials`: the web interface is secured by a simple name/password check without any sophisticated user management. Therefore one can specify these parameters here. **THE DEFAULT VALUES SHOULD BE CHANGED FOR "PRODUCTIVE" SETUPS**
* `isHttpRedirectEnabled`: this can be set to false, when the normal port 80 should not be used for redirecting to the SSL encrypted instance of the application.
* `isDemoMode`: this can be set to true, in order to disable controls for changing connection string and controller type on the configuration page.
* `operatorUrl`: specify a URL of the institution that operates the visualization.

All other parameters should be left in place to ensure proper operation. Especially changing version numbers of dependencies might cause severe interoperability issues, as Node.js packages are not downward-compatible by default.

#### Operator Logo and Link

You might also want to change the logo at `<project root>/public/images/OperatorLogo.jpg`. It should be a JPEG file with 150 x 65 px. The link's target can be changed as specified above.

### Starting

There are two common options for running the application. In either case there will be an application running under `localhost:appPort`.

#### Foreground 

	cd <project root>
	sudo /usr/bin/nodejs main.js

#### Background

##### Backgroud Task

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
The code for client-side is concatenated and uglified using grunt. The package comes with a compiled version of the latest code (`/public/js/dist.min.js`). If you change anything, you have to execute `grunt` in the `<project root>`.

In order to have `grunt` as a command line utility you have to enter the following: 

`sudo npm install -g grunt-cli`

### Server

The code on the server side can be changed at any time. As *Node.js* is requiring subpackages only once, a restart of the application might be necessary.


## Resources

* [Open Networking Foundation](https://www.opennetworking.org/)
* [OpenFlow Specification](https://www.opennetworking.org/sdn-resources/onf-specifications/openflow)


## Questions?

Please send us feedback via [email](mailto:info@openflow.uni-saarland.de) on any problems you might encounter during installation and operation that are not covered here. The software and documentation are under constant development and improvements are highly appreciated. If you have any questions do not hesitate to ask them.
