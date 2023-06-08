
async function fetchData() {
  
  const url = '/assets/json/meds.json';
    
  const response = await fetch(url);
      
  if(response.status === 200) {

    console.log(response.status);

    return response.json();  
    
  }
  else {
    return 0;
  }

}

fetchData().then(data => {
  console.log(data);
  
  
let outputData = data.map(item=>{
return {
        "dc": parseInt(item.dc),
        "gn": item.gn,
        "us": item.us,
        "mrp": parseInt(item.mrp),
        "avl": Math.round(Math.random())
       }
});

console.log(outputData);

var jsonStr = JSON.stringify(outputData);

document.body.innerHTML = jsonStr;

  
});



