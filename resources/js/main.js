var reader; //GLOBAL File Reader object for demo purpose only


    /**
     * Check for the various File API support.
     */
    function checkFileAPI() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            reader = new FileReader();
            return true; 
        } else {
            alert('The File APIs are not fully supported by your browser. Fallback required.');
            return false;
        }
    }

    /**
     * read text input
     */
    function readText(filePath) {
        var output = ""; //placeholder for text output
        if(filePath.files && filePath.files[0]) {           
            reader.onload = function (e) {
                output = e.target.result;
                displayContents(output);
            };//end onload()
            reader.readAsText(filePath.files[0]);
        }//end if html5 filelist support
        else if(ActiveXObject && filePath) { //fallback to IE 6-8 support via ActiveX
            try {
                reader = new ActiveXObject("Scripting.FileSystemObject");
                var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
                output = file.ReadAll(); //text contents of file
                file.Close(); //close file "input stream"
                displayContents(output);
            } catch (e) {
                if (e.number == -2146827859) {
                    alert('Unable to access local files due to browser security settings. ' + 
                     'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' + 
                     'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"'); 
                }
            }       
        }
        else { //this is where you could fallback to Java Applet, Flash or similar
            return false;
        }       
        return true;
    }   

       

    
// module for performing manipulations on
// Sacred 2 scripts
const ScriptController = (function(){

    
    // data structure for 'NewBonus' items
    // in the blueprint.txt file
    var BonusItem = function(original, modded) {
        this.original = original;
        this.modded = modded;
        this.diffOG = [];
        this.changeDif = [];
    }

    // data structure for difficultyvalue
    var DifficultyValue = function(original, modded) {
        this.original = original;
        this.modded = modded;
        this.value1 = 0;
        this.value2 = 0;
    }

    // extract numerical difficulty values
    // from each difficulty entry in a bonus
    DifficultyValue.prototype.popValues = function() {
        // regular expression to 2nd and 3rd
        // numbers in difficultyvalue
        let difNum = new RegExp(/,\d+/, 'g');
        let difNums = this.original.match(difNum);
        
        // extract number from difNums array
        this.value1 = parseInt(difNums[0].match(/\d+/,'g')[0]);
        this.value2 = parseInt(difNums[1].match(/\d+/,'g')[0]);

    }

    // generate difficultyvalue objects from a BonusItem
    BonusItem.prototype.popDiffs = function() {
        // regular expression to match difficulty value
        // in a bonus item
        let dif = new RegExp(/difficultyvalue[^}]+},/, 'g');
        let difListT = [];
        let diffList = [];
        let difListModT = [];
        

        diffListT = this.original.match(dif);
        diffListModT = this.modded.match(dif);
        
        // if NewBonus item does not have difficultyvalues, exit method
        if (!diffListT) return;

        // generate DifficultyValue objects
        // for each difficultyvalue
        diffListT.forEach(function(item, n){
            let diffObj = new DifficultyValue
                (diffListT[n],
                diffListModT[n]);
            diffList.push(diffObj);
        });
        
        // extract the numerical values from the difficultyvalue objects
        diffList.forEach(function(item, n){
            item.popValues();
        });

        console.dir(this);

        
        this.diffOG = diffList;
        
    }

    BonusItem.prototype.calculateDifficultyMod = function() {
        // orginal difficulty values 1 and 2
        let diffVals1 = [];
        let diffVals2 = [];
        // change in value for original values
        let diffValsY1 = [];
        let diffValsY2 = [];

        // modified difficulty values 1 and 2
        let modVals1 = [];
        let modVals2 = [];

        // change in value for each modified value
        let modValsY1 = [];
        let modValsY2 = [];

        let ref = this;

        // if newBonus has no difficultyvalues
        // then stop calculation
        if (this.diffOG.length < 1) return;

        this.diffOG.forEach(function(item, n){
            diffVals1.push(item.value1);
            diffVals2.push(item.value2);
        });
        

        // if first and last value are identical
        // there is no progression, so return
        if (diffVals1[0] === diffVals1[diffVals1.length - 1] 
            && diffVals2[0] === diffVals2[diffVals2.length - 1]) {
                
                return;
            }
        
        // calculate difference between each difficluty value
        for (let diffInd = 0; diffInd < diffVals1.length - 1; diffInd++) {
            let adInd = 0;
            adInd = diffInd + 1;
            let tVal = 0;
            tVal = diffVals1[adInd] - diffVals1[diffInd];
            diffValsY1.push(tVal);
        }
        for (let diffInd = 0; diffInd < diffVals2.length - 1; diffInd++) {
            let adInd = 0;
            adInd = diffInd + 1;
            let tVal = 0;
            tVal = diffVals2[adInd] - diffVals2[diffInd];
            diffValsY2.push(tVal);
        }

        
        // if first and last delta are equal,
        // calculate linear progression
        if (diffValsY1[0] === diffValsY1[diffValsY1.length - 1]) {
            
            let tVal = JSON.parse(JSON.stringify(diffValsY1[0]));
            for (let ind = 0; ind < diffValsY1.length; ind++) {
                modValsY1.push(tVal);
            }
            
        } else {
            let Y1 = JSON.parse(JSON.stringify(diffValsY1[1])) - JSON.parse(JSON.stringify(diffValsY1[0]));
            let Y2 = JSON.parse(JSON.stringify(diffValsY1[2])) - JSON.parse(JSON.stringify(diffValsY1[1]));
            let Y3 = JSON.parse(JSON.stringify(diffValsY1[3])) - JSON.parse(JSON.stringify(diffValsY1[2]));

            // if each value increases by same amount
            if (Y1 !== 0 && Y1 === Y2 && Y2 === Y3) {
                let modY = Y1 + JSON.parse(JSON.stringify(diffValsY1[3]));
                for (let ind = 0; ind < diffValsY1.length; ind++) {
                    modValsY1.push(modY);
                    modY += Y1;
                    
                }
                
            } else {
                let Yavg = Math.floor((Y1 + Y2 + Y3) / 3);
                // if change between 3rd & 4th item
                // is less than average
                if ((Y3 - Y2) <= Yavg) {
                    let modY = JSON.parse(JSON.stringify(diffValsY1[3])) + Yavg;
                    for (let ind = 0; ind < diffValsY1.length; ind++) {
                        modValsY1.push(modY);
                        modY += Yavg;
                    }
                    
                }
                if ((Y3 - Y2) > Yavg) {
                    // let total change be Y3 * Yrat, then
                    // apply it across the same ratio of 
                    // each change step to total change
                    let Yrat = Y3 / Yavg;
                    let Ytot = JSON.parse(JSON.stringify(diffValsY1[3])) +
                        JSON.parse(JSON.stringify(diffValsY1[2])) +
                        JSON.parse(JSON.stringify(diffValsY1[1])) +
                        JSON.parse(JSON.stringify(diffValsY1[0]));
                    // i.e. rat1 + rat2 + rat 3 should = 1
                    let rat1 = JSON.parse(JSON.stringify(diffValsY1[0])) / Ytot;
                    let rat2 = JSON.parse(JSON.stringify(diffValsY1[1])) / Ytot;
                    let rat3 = JSON.parse(JSON.stringify(diffValsY1[2])) / Ytot;
                    let rat4 = JSON.parse(JSON.stringify(diffValsY1[3])) / Ytot;
                    let rats = [rat1, rat2, rat3, rat4];
                    
                    let modY = Y3;
                    for (let ind = 0; ind < diffValsY1.length; ind++) {
                        modValsY1.push(modY);
                        modY = Math.floor(Ytot * Yrat * rats[ind]);
                    }
                    

                }
            }
        }

        

        // if first and last delta are equal,
        // calculate linear progression
        if (diffValsY2[0] === diffValsY2[diffValsY2.length - 1]) {
            let tVal = JSON.parse(JSON.stringify(diffValsY2[0]));
            for (let ind = 0; ind < diffValsY2.length; ind++) {
                modValsY2.push(tVal);
            }
            
        } else {
            let Y1 = JSON.parse(JSON.stringify(diffValsY2[1])) - JSON.parse(JSON.stringify(diffValsY2[0]));
            let Y2 = JSON.parse(JSON.stringify(diffValsY2[2])) - JSON.parse(JSON.stringify(diffValsY2[1]));
            let Y3 = JSON.parse(JSON.stringify(diffValsY2[3])) - JSON.parse(JSON.stringify(diffValsY2[2]));

            // if each value increases by same amount
            if (Y1 !== 0 && Y1 === Y2 && Y2 === Y3) {
                let modY = Y1 + JSON.parse(JSON.stringify(diffValsY2[3]));
                for (let ind = 0; ind < diffValsY2.length; ind++) {
                    modValsY2.push(modY);
                    modY += Y1;
                }
                
            } else {
                let Yavg = Math.floor((Y1 + Y2 + Y3) / 3);
                // if change between 3rd & 4th item
                // is less than average
                if ((Y3 - Y2) <= Yavg) {
                    let modY = JSON.parse(JSON.stringify(diffValsY2[3])) + Yavg;
                    for (let ind = 0; ind < diffValsY2.length; ind++) {
                        modValsY2.push(modY);
                        modY += Yavg;
                    }
                    
                }
                if ((Y3 - Y2) > Yavg) {
                    // let total change be Y3 * Yrat, then
                    // apply it across the same ratio of 
                    // each change step to total change
                    let Yrat = Y3 / Yavg;
                    let Ytot = JSON.parse(JSON.stringify(diffValsY2[3])) +
                        JSON.parse(JSON.stringify(diffValsY2[2])) +
                        JSON.parse(JSON.stringify(diffValsY2[1])) +
                        JSON.parse(JSON.stringify(diffValsY2[0]));
                    // i.e. rat1 + rat2 + rat 3 should = 1
                    let rat1 = JSON.parse(JSON.stringify(diffValsY2[0])) / Ytot;
                    let rat2 = JSON.parse(JSON.stringify(diffValsY2[1])) / Ytot;
                    let rat3 = JSON.parse(JSON.stringify(diffValsY2[2])) / Ytot;
                    let rat4 = JSON.parse(JSON.stringify(diffValsY2[3])) / Ytot;
                    let rats = [rat1, rat2, rat3, rat4];
                    
                    let modY = Y3;
                    for (let ind = 0; ind < diffValsY2.length; ind++) {
                        modValsY2.push(modY);
                        modY = Math.floor(Ytot * Yrat * rats[ind]);
                    }
                    

                }
            }
        }

        
        // const tName = this.original.match(/name =\"[^"]+\",/, 'g');
        // console.log(this.original);
        const tabit = [diffValsY1, modValsY1, diffValsY2, modValsY2];
        console.table(tabit);
        // console.dir(diffValsY1);
        // console.dir(diffValsY2);
        // console.dir(modValsY1);
        // console.dir(modValsY2);

        // calculate modVals1 & modVals2
        // from modValsY1 & modValsY2

        // set each modded difficulty text
        // in the difficultyvalue object

    }

   /*
   * get all newBonus in an array
   */
   function extractBonuses(txt) {
        
   }

   return {
       modBlueprint: function(blueText) {
           // regular expression to match a bonus item
           // in bonus exporter
           let bonus = new RegExp(/[^ ]newBonus[^)]+\);/, 'g');
           let bonusList = [];
           let bonusListMod = [];

           bonusList = blueText.match(bonus);
           bonusListMod = blueText.match(bonus);

           let bonusBonus = [];
           bonusList.forEach(function(item, n){
               let bonusT = new BonusItem(bonusList[n], bonusListMod[n]);     
               bonusBonus.push(bonusT);
           });

           bonusBonus.forEach(function(item, n){
            bonusBonus[n].popDiffs();
            bonusBonus[n].calculateDifficultyMod();
           });
           console.dir(bonusBonus);
           
       }
   }

})();


// ------------=======------------
// ----- Main UI Control Module
// ------------=======------------
const UIController = (function(){
    
    // --------=======--------
    // Store DOM strings
    // --------=======--------
    const DOMStrings = {
        mainBody: '#mainBody',
        blueprintSelect: '#blueprintSelector',
        blueprintSubmit: '#blueprint-submit',
        blueprintContent: '#blueprint-in-content',
        blueprintOutput: '#blueprint-output'
    }


    // --------=======--------
    // display content using a basic HTML replacement
    // --------=======--------
    displayContents = function(txt) {
        var el = document.getElementById('#blueprint-output'); 
        el.innerHTML = txt; //display output in DOM
        // console.log(txt);
    }

    // Public methods of UIController
    return {
        
        // --------=======--------
        // -- Check for the various File API support.
        // --------=======--------
        checkFileAPI: function() {
            console.log('check api');
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                reader = new FileReader();
                return true; 
            } else {
                alert('The File APIs are not fully supported by your browser. Fallback required.');
                return false;
            }
        },
        
        
        // --------=======--------
        // --  read text input
        // --------=======--------
        readText: function(filePath) {
            console.log(filePath.files);
            if (filePath.files.length === 0) return;
            var output = ""; //placeholder for text output
            if(filePath.files && filePath.files[0]) {           
                reader.onload = function (e) {
                    console.log(e);
                    output = e.target.result; 
                    displayContents(output);   
                };//end onload()
                
                reader.readAsText(filePath.files[0]).then(function(){return output});
                // console.dir(output);
                // return output;
            }//end if html5 filelist support
            else if(ActiveXObject && filePath) { //fallback to IE 6-8 support via ActiveX
                try {
                    reader = new ActiveXObject("Scripting.FileSystemObject");
                    var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
                    output = file.ReadAll(); //text contents of file
                    file.Close(); //close file "input stream"
                    return output;
                } catch (e) {
                    if (e.number == -2146827859) {
                        alert('Unable to access local files due to browser security settings. ' + 
                        'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' + 
                        'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"'); 
                    }
                }       
            }
            else { //this is where you could fallback to Java Applet, Flash or similar
                return false;
            }       
           
        },

        getDomStrings: function() {
            return DOMStrings;
        }

        
    }

})();

const controller = (function(ScriptCtrl, UICtrl){
    
    const setupEventListeners = function() {
        const DOM = UICtrl.getDomStrings();
        console.dir(document.querySelector(DOM.blueprintSubmit));

        document.querySelector(DOM.blueprintSubmit)
            .addEventListener('click', processBlueprint);

        // document.querySelector(DOM.mainBody)
        //     .addEventListener('onload', UICtrl.checkFileAPI);
        
        // const fileSel = document.querySelector(DOM.blueprintSelect);

        // document.querySelector(DOM.blueprintSelect)
        //     .addEventListener('onchange', getText(fileSel));

        // document.querySelector
    }

    processBlueprint = function(e) {
        e.preventDefault();
        console.log('hello');
        const DOM = UICtrl.getDomStrings();
        // console.dir(document.querySelector(DOM.blueprintContent));
        let blueprintText = document.querySelector(DOM.blueprintContent)
            .value;

        ScriptCtrl.modBlueprint(blueprintText);
        document.querySelector(DOM.blueprintOutput).innerText = blueprintText;
    }

    getText = function(text) {
        console.log(text.value);
        let blueprintTxt = '';
        blueprintTxt = UICtrl.readText(text);
        window.setTimeout(function(){console.log(blueprintTxt)}, 2000);
        // UICtrl.displayContents(blueprintTxt);
    }

    // Public methods of Controller
    return {
        init: function() {
            setupEventListeners();
        }
    }
})(ScriptController, UIController);

controller.init();

// let testArr = [1,2,3];
// let testVal = JSON.parse(JSON.stringify(testArr[1]));
// testVal += 5;
// console.log(testVal, testArr);