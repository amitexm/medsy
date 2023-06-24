function editUpdationQueue(e) {

    // let dc = parseInt(e.target.parentElement.children[0].innerHTML.match(/\d+/));
    let dc = parseInt(e.target.dataset.dc);

    if ("avl" === e.target.name) {

        // Find medicine to change its Availability in jsonMeds(generated by combining jsonMedsData and jsonMedsAvl in fetchdata()).
        let dc_jsonMedsIndx = jsonMeds.findIndex((item) => item.dc === dc);
        // jsonMeds[dc_jsonMedsIndx].avl = Number(e.target.checked);

        // Find medicine and change its Availability in jsonMedsAvl. Both arrays are sorted so they should contain same medicine at same index.
        let dc_jsonMedsAvlIndx = jsonMedsAvl.findIndex((item) => item === dc);
        if (dc_jsonMedsAvlIndx > -1) {
            jsonMedsAvl.splice(dc_jsonMedsAvlIndx, 1);
        } else {
            jsonMedsAvl.push(dc);
        }

        let dc_updationQueueIndx = updationQueue.findIndex((item) => item.dc === dc);
        if (dc_updationQueueIndx > -1) {
            updationQueue.splice(dc_updationQueueIndx, 1);
        } else {
            let updationMed = {
                dc: dc,
                gn: jsonMeds[dc_jsonMedsIndx].gn,
                us: jsonMeds[dc_jsonMedsIndx].us,
                mrp: jsonMeds[dc_jsonMedsIndx].mrp,
                avl: jsonMeds[dc_jsonMedsIndx].avl,
                fav: jsonMeds[dc_jsonMedsIndx].fav
            };
            updationQueue.push(updationMed);
        }

        let counterUpdationQueue = updationQueue.length ? updationQueue.length : "";
        counterBtnUpdationQueue.innerHTML = counterUpdationQueue;
        counterBtnUpdate.innerHTML = counterUpdationQueue;
    }

    else if ("fav" === e.target.name) {

        // Change favorite in jsonMeds (generated by combining jsonMedsData and jsonMedsAvl in fetchdata()).
        let dc_jsonMedsIndx = jsonMeds.findIndex((item) => item.dc === dc);
        jsonMeds[dc_jsonMedsIndx].fav = Number(e.target.checked);

        // Change favourite in jsonMedsFav Array dc values.
        let dc_jsonMedsFavIndx = jsonMedsFav.findIndex((item) => item === dc);
        if (dc_jsonMedsFavIndx > -1) {
            jsonMedsFav.splice(dc_jsonMedsFavIndx, 1);
        } else {
            jsonMedsFav.push(dc);
        }

        // Change favorite in favQueue -- Array of fovorited medicin Objects.
        let dc_favQueueIndx = favQueue.findIndex((item) => item.dc === dc);
        if (dc_favQueueIndx > -1) {
            favQueue.splice(dc_favQueueIndx, 1);
        } else {
            let favMed = {
                dc: dc,
                gn: jsonMeds[dc_jsonMedsIndx].gn,
                us: jsonMeds[dc_jsonMedsIndx].us,
                mrp: jsonMeds[dc_jsonMedsIndx].mrp,
                avl: jsonMeds[dc_jsonMedsIndx].avl,
                fav: jsonMeds[dc_jsonMedsIndx].fav
            };
            favQueue.push(favMed);
        }
        counterFavNavBtn.style.display = favQueue.length ? "block" : "none";

        // Change favorite in updationQueue -- Array of medicin Objects to change Availability.
        let dc_updationQueueIndx = updationQueue.findIndex((item) => item.dc === dc);
        if (dc_updationQueueIndx > -1) {
            updationQueue[dc_updationQueueIndx].fav = Number(e.target.checked);
        }

    }

    e.stopPropagation(); //warning
}