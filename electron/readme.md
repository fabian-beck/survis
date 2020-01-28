# SurVis as an Electron Desktop App

## Install electron

```
npm install --save-dev electron
```

More information: https://www.electronjs.org/docs/tutorial/first-app 

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