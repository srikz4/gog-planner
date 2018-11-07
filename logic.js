var buildingsObj = null;
    var catacombsObj = null;
    var costObj = null;
    var rssObj = null;
    var spirit_minesObj = null;

    var path = "meta/%WHAT%.json";

    $(document).ready(function() {
        $("#result").hide();
        $("#planner").show();

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1;
        var yyyy = today.getFullYear();

        if(dd<10) { dd='0'+dd } 
        if(mm<10) { mm='0'+mm } 

        today = yyyy+'-'+mm+'-'+dd;
        limit = (yyyy+1)+'-'+mm+'-'+dd;
        
        $("#castle_to").attr("min", parseInt($("#castleLvl").val()) + 1);

        $("#targetBy").attr("min", today);
        $("#targetBy").attr("max", limit);
        $("#targetBy").val(today);
        
        loadData();
    });

    function reflectTarget() {
        
        if($("#castle_to").attr("min") >= $("#castle_to").attr("max")) {
            $("#castle_to").val(($("#castle_to").val() <= $("#castleLvl").val()) ? $("#castleLvl").val() : $("#castle_to").val());
            $("#castle_to").attr("min", $("#castle_to").attr("max"));
        } else {
            $("#castle_to").val(($("#castle_to").val() <= $("#castleLvl").val()) ? parseInt($("#castleLvl").val()) + 1 : $("#castle_to").val());
            $("#castle_to").attr("min", parseInt($("#castleLvl").val()) + 1);        
        }
    }

    function cleanUp() {
        $("#result").hide();
        $("#planner").show();

        $("#castleTarget").val("");
        $("#castleTargetBy").val("");

        $("#targetUpgrades").html("")
        $("#targetRssCost").html("");
        $("#totalTime").val("");
    }

    function doSubmit() {
        $("#result").show();
        $("#planner").hide();

        $("#castleTarget").val($("#castle_to").val());
        $("#castleTargetBy").val($("#targetBy").val());

        var resp = {
            "plan_id" : $("#plan_id").val(),
            "target" : {
                "castle" : parseInt($("#castle_to").val()),
                "by" : $("#targetBy").val()
            },
            "buildings" : {
                "castle" : parseInt($("#castleLvl").val()),
                "academy" : parseInt($("#academyLvl").val()),
                "airship" : parseInt($("#airshipLvl").val()),
                "artillery" : parseInt($("#artilleryLvl").val()),
                "infantry" : parseInt($("#infantryLvl").val()),
                "castle" : parseInt($("#castleLvl").val()),
                "embassy" : parseInt($("#embassyLvl").val()),
                "farm" : parseInt($("#farmLvl").val()),
                "forge" : parseInt($("#forgeLvl").val()),
                "warhall" : parseInt($("#warhallLvl").val()),
                "hospital" : parseInt($("#hospitalLvl").val()),
                "ironMine" : parseInt($("#ironMineLvl").val()),
                "lookout" : parseInt($("#lookoutLvl").val()),
                "lumberyard" : parseInt($("#lumberyardLvl").val()),
                "militaryTent" : parseInt($("#militaryTentLvl").val()),
                "munitions" : parseInt($("#munitionsLvl").val()),
                "distance" : parseInt($("#distanceLvl").val()),
                "silverMine" : parseInt($("#silverMineLvl").val()),
                "cavalry" : parseInt($("#cavalryLvl").val()),
                "trade" : parseInt($("#tradeLvl").val()),
                "traps" : parseInt($("#trapsLvl").val()),
                "wall" : parseInt($("#wallLvl").val()),
                "warehouse" : parseInt($("#warehouseLvl").val())
            },
            "catacombs" : {
                "floors" : parseInt($("#catacombs_floorsLvl").val()),
                "coins" : parseInt($("#satchel").val())
            },
            "spirit_mines" : {
                "floors" : parseInt($("#mines_floorsLvl").val()),
                "crystals" : parseInt($("#crystals").val())
            }
        };

        setPlan(resp);
    };

    function setPlan(resp) {
        preparePlan(resp);
        //setTargetTime();
        //setTargetRss();
        //setTargetUpgrades();
        //cleanUp();
    }

    function preparePlan(resp) {
        var htmlRssHolder = "";
        var htmlUpgHolder = "";
        var rssList = { "Food" : 0, "Wood" : 0, "Iron" : 0, "Silver" : 0 };
        var totalTime = "0d 0:00:00";

        var currentCastleObj = buildingsObj.filter(obj => {
            return obj.name == "Castle"
        })[0];

        for (var i = resp.buildings.castle + 1; i <= resp.target.castle; i++) {
            // console.log("loop " + i + " of " + resp.target.castle);
            var currentCostObj = costObj.filter(obj => {
                return obj.building == currentCastleObj.id && obj.level == i
            })[0];
            $.each(buildingsObj, function(index) {
                var upgBuilding = currentCostObj.needs.filter(obj => {
                    return obj.k == buildingsObj[index].id
                })[0];
                if(upgBuilding != undefined) {
                    htmlUpgHolder += "<li>" + buildingsObj[index].name + " - " + upgBuilding.v + "</li>";
                }
            });
            $.each(rssObj, function(index) {
                rssList[rssObj[index].name] += parseInt(currentCostObj[rssObj[index].name.toLowerCase()]);
            });
            totalTime = addTime(currentCostObj.time, totalTime);
        }

        $.each(rssList, function(k, v) {
            htmlRssHolder += "<li>" + k + " - " + formatRssAmount(v) + "</li>";
        });

        $("#targetRssCost").html(htmlRssHolder);
        $("#targetUpgrades").html(htmlUpgHolder);
        $("#totalTime").val(totalTime);
    }

    function addTime(addThis, toThis) {
        var addThisParts = splitTime(addThis);
        var toThisParts = splitTime(toThis);

        toThisParts.secs += addThisParts.secs;
        toThisParts.mins += addThisParts.mins;
        toThisParts.hours += addThisParts.hours;

        toThisParts.days += addThisParts.days;

        return formatTime(toThisParts);
    }

    function splitTime(aTime) {
        var days = 0;
        var time = "";

        if(aTime.indexOf("d ") != -1) {
            var tmp = aTime.split("d ");
            days = parseInt(tmp[0]);
            time = tmp[1].split(":");
        } else {
            time = aTime.split(":");
        }

        return {
            "days" : days,
            "hours" : parseInt(time[0]),
            "mins" : parseInt(time[1]),
            "secs" : parseInt(time[2])
        };
    }

    function formatTime(aTime) {
        if(aTime.secs > 59) {
            aTime.mins += ~~(aTime.secs / 60);
            aTime.secs %= 60;
        }

        if(aTime.mins > 59) {
            aTime.hours += ~~(aTime.mins / 60);
            aTime.mins %= 60;
        }

        if(aTime.hours > 23) {
            aTime.days += ~~(aTime.hours / 24);
            aTime.hours %= 24;
        }

        return "" + aTime.days + "d " + pad(aTime.hours) + ":" + pad(aTime.mins) + ":" + pad(aTime.secs);
    }

    function pad(unit) {
        if(unit < 10) return "0" + unit;
        return unit;
    }

    function formatRssAmount(rssAmount) {
        return rssAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function loadData() {
        if(buildingsObj == null) $.getJSON(path.replace("%WHAT%", "buildings"), function(data) { buildingsObj = data; });
        if(catacombsObj == null) $.getJSON(path.replace("%WHAT%", "catacombs"), function(data) { catacombsObj = data; });
        if(costObj == null) $.getJSON(path.replace("%WHAT%", "cost"), function(data) { costObj = data; });
        if(rssObj == null) $.getJSON(path.replace("%WHAT%", "rss"), function(data) { rssObj = data; });
        if(spirit_minesObj == null) $.getJSON(path.replace("%WHAT%", "spirit_mines"), function(data) { spirit_minesObj = data; });
    }
