if ( input.target.value.length >= 4) {
    
    // medlistListSearchResults.style.display = 'none';

    if ( input.target.value.length === 4 ) {

      medlistList.style.display = "none";
 
      medlistList.setAttribute("style", "position:absolute; left:-999999px;");

      // setTimeout(() => {
      //   medlistList.setAttribute("style", "position:absolute; left:-999999px;");
      // });
    }
    


    // (async () => {
    //   medlistList.setAttribute("style", "visibility:hidden; height:0px;");
    // })();

   
    // medlistList.style.visibility = "hidden";

    // medlistList.setAttribute("style", "position:absolute; left:-999999px;");
    //medlistListSearchResults.display = "block";
    
    
    // const filtered = [];

    // const searchFor = input.target.value.toLowerCase().trim();

    // for (let i = 0; i < jsonData.length; i++) {
    
    //   const searchIn = jsonData[i].gn.toLowerCase().trim();

    //   if ( searchIn.indexOf(searchFor) != -1 ) {
    //     filtered.push(jsonData[i]);
    //   }
    // }   
    
    

    const filtered = jsonData.filter((item) => {
  
      const searchFor = input.target.value.toLowerCase().trim();
    
      const searchIn = item.gn.toLowerCase().trim();

      return searchIn.includes(searchFor);

    });

    listMeds(filtered, medlistListSearchResults); ////display filtered list of meds.

    // medlistListSearchResults.removeAttribute('style');

  } else { 

    
      medlistListSearchResults.innerHTML = "";

      medlistList.removeAttribute("style");      

  }