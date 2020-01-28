# SurVis as an Electron Desktop App

## Init npm, install electron
https://www.electronjs.org/docs/tutorial/first-app 

```
npm init
npm install --save-dev electron
```

## Run electron app
```
npm start
```

## Package app

Install packager:
```
npm install electron-packager -g
```

Package:
```
electron-packager . --extra-resource=../src --overwrite
```