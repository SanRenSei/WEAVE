

let initStyle = () => {
  let sheet = window.document.styleSheets[0];
  if (!sheet) {
    document.head.appendChild(document.createElement('style'));
    sheet = window.document.styleSheets[0];
  }
  sheet.insertRule('weave { display: none; }', sheet.cssRules.length);
}

let listenForWeaveElement = (cb) => {
  let weaveElem = document.getElementsByTagName('weave')[0];
  if (!weaveElem) {
    setTimeout(() => {listenForWeaveElement(cb)}, 10);
    return;
  }
  cb(weaveElem);
}

let isLocatorChar = (c) => {
  return c>='a' && c<='z' || c>='A' && c<='Z' || c=='.' || c=='#';
}

let isNumericChar = (c) => {
  return c>='0' && c<='9';
}

let tokenizeWeaveCode = (str) => {
  str = str.trim();
  let tokens = [];
  let parseIndex = 0;
  while (str.length>0) {
    if (isLocatorChar(str[0])) {
      parseIndex = 1;
      while (isLocatorChar(str[parseIndex])) {
        parseIndex++;
      }
      tokens.push({type:'element',value:str.substring(0, parseIndex)});
      str = str.substring(parseIndex).trim();
    } else if (str[0]=='"') {
      parseIndex = 1;
      while (str[parseIndex]!='"' || str[parseIndex-1]=='\\') {
        parseIndex++;
      }
      tokens.push({type:'text',value:str.substring(1, parseIndex)});
      str = str.substring(parseIndex+1).trim();
    } else if (isNumericChar(str[0])) {
      parseIndex = 1;
      while (isNumericChar(str[parseIndex])) {
        parseIndex++;
      }
      tokens.push({type:'text',value:str.substring(0, parseIndex)});
      str = str.substring(parseIndex).trim();
    } else if (str[0]=='{') {
      parseIndex = 1;
      let depth = 0;
      while (str[parseIndex]!='}' || depth!=0) {
        if (str[parseIndex]=='{') {
          depth++;
        }
        if (str[parseIndex]=='}') {
          depth--;
        }
        parseIndex++;
      }
      tokens.push({type:'params',value:str.substring(0, parseIndex+1)});
      str = str.substring(parseIndex+1).trim();
    } else {
      throw 'Invalid char: ' + str[0];
    }
  }
  return tokens;
}

let createElement = (locator) => {
  let id, className;
  if (locator.indexOf('#')>0) {
    id = locator.substring(locator.indexOf('#')+1);
    locator = locator.substring(0, locator.indexOf('#'));
  }
  let classes = locator.split('.');
  for (let i=1;i<classes.length;i++) {
    className += classes[i]+' ';
  }
  let elem = document.createElement(classes[0]);
  if (id) {
    elem.id = id;
  }
  if (className) {
    elem.class = className;
  }
  return elem;
}

let findElement = (locator) => {
  let id, className;
  if (locator.indexOf('#')>=0) {
    id = locator.substring(locator.indexOf('#')+1);
    locator = locator.substring(0, locator.indexOf('#'));
  }
  let classes = locator.split('.');
  for (let i=1;i<classes.length;i++) {
    className += classes[i]+' ';
  }
  if (id) {
    return document.getElementById(id);
  }
  if (className) {
    return document.getElementsByClassName(className)[0];
  }
  return null;
}

let renderObjects = (tokens) => {
  let elementToCreate;
  for (let i=0;i<tokens.length;i++) {
    let nextToken = tokens[i];
    if (nextToken.type=='element') {
      if (elementToCreate) {
        document.body.appendChild(elementToCreate);
        elementToCreate = null;
      }
      elementToCreate = createElement(nextToken.value);
    }
    if (nextToken.type=='text') {
      elementToCreate.innerText = nextToken.value;
    }
    if (nextToken.type=='params') {
      let obj = eval('('+nextToken.value+')');
      for (let key of Object.keys(obj)) {
        if (key=='onClick' || key=='onclick') {
          elementToCreate.addEventListener('click', obj[key].bind(elementToCreate));
        } else {
          elementToCreate[key] = obj[key];
        }
      }
    }
  }
  if (elementToCreate) {
    document.body.appendChild(elementToCreate);
  }
}

let updateObjects = (tokens) => {
  let elementToUpdate;
  for (let i=0;i<tokens.length;i++) {
    let nextToken = tokens[i];
    if (nextToken.type=='element') {
      elementToUpdate = findElement(nextToken.value);
    }
    if (nextToken.type=='text') {
      elementToUpdate.innerText = nextToken.value;
    }
  }
}

let findCompleteObject =(inputString) => {
  const regex = /\{(?:[^{}]+|\{(?:[^{}]+|\{[^{}]*\})*\})*\}/g;
  const matches = inputString.match(regex);
  return matches ? matches[0] : null;
}

window.weave = (...str) => {
  let tokens = tokenizeWeaveCode(str.join(' '));
  updateObjects(tokens);
}

initStyle();
listenForWeaveElement(w => {
  let tokens = tokenizeWeaveCode(w.innerText.trim());
  renderObjects(tokens);
});