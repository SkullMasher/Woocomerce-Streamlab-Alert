# Woocomerce Streamlab Alert
Send an alert to a stream when a woocomerce webhook action is detected

## Instalation
[Install nodeJS](https://nodejs.org)

Install nodeJS dependencies
```
npm i
```
Create your config file
```
cp .env.sample .env
```
Create an sqlite database file at the root of the project
```
touch db.sqlite
```
Start the app
```
node index.js
```

Point your woocommerce webhooks to `https://yoururl.eu/alert`

Point your streamlab application Redirect URI
 to `https://yoururl.eu/auth` don't forget to whitelist your user (no support for multiple account for now).

Navigate to `https://yoururl.eu` to authorize the app and generate an access token.

## Ressources

### Woocomerce
How to set up a woocomerce webhook : [link](https://docs.woocommerce.com/document/webhooks/#section-2)

Visit the woocomerce hook reference : [link](https://docs.woocommerce.com/wc-apidocs/hook-docs.html)
### Streamlab
Api reference : [link](https://dev.streamlabs.com/v1.0/reference)

Register your streamlab application : [link](https://dev.streamlabs.com/docs/register-your-application)

### Apache2
Proxy config for Apache2
```
ProxyRequests Off
ProxyPreserveHost On

ProxyPass /streamlabs http://127.0.0.1:3000
ProxyPassReverse /streamlabs http://127.0.0.1:3000
```
