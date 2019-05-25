var fs = require("fs");
console.log("Read "+process.argv[2])
var content = fs.readFileSync(process.argv[2]);
var jsonContent = JSON.parse(content);

for (i in jsonContent.e) {
    e = jsonContent.e[i];
    //console.log(e);
    if (e.p == undefined || e.p=="")
        e.p = []
    else
        e.p = e.p.split(" ");
}

ofn = process.argv[2]+".2.txt";
console.log("Write "+ofn)
let data = JSON.stringify({e:jsonContent.e},null,2);
fs.writeFileSync(ofn, data);

console.log("Verify")
h = {}
for (i in jsonContent.e.reverse()) {
    e = jsonContent.e[i];
    h[e.c] = 1;
    for (j in e.p) {
        if (h[e.p[j]] != 1) {
            console.log("Parent '" + e.p[j] + "' not present");
        }
    }
    v = Date.parse(e.d);
}
