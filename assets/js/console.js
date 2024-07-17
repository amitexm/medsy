const tr = document.querySelectorAll('table tbody tr');

const loopSize = tr.length;

let medsData = [];

for (let i = 1; i < loopSize; i++) {
    medsData[i - 1] = {
        dc: tr[i].children[1].innerHTML,
        gn: tr[i].children[2].innerHTML,
        us: tr[i].children[3].innerHTML,
        //mrp: Math.trunc(tr[i].children[4].innerHTML)
        mrp: Math.trunc(tr[i].children[4].innerHTML) ? Math.trunc(tr[i].children[4].innerHTML) : ''
    };
}
console.log(JSON.stringify(medsData.sort((a, b) => a.dc - b.dc)));




// for (let i = 1; i < loopSize; i++) {
//     medsAvl[i - 1] = {
//         dc: tr[i].children[1].innerHTML,
//         avl: Math.round(Math.random())
//     };
// }
// console.log(JSON.stringify(medsAvl.sort((a, b) => a.dc - b.dc)));

let medsAvl = [];

for (let i = 1; i < loopSize; i++) {
    medsAvl[i - 1] = Math.round(Math.random());
} 
console.log(JSON.stringify(medsAvl));





