const yearsToProcess = [
    "2016",
    "2017",
    "2018",
    "2019",
    "2020"
];
let originalCash = 4000;
const monthlyAdd = 4000;
const cashTakeout = 2000;
const hasCashLimit = true;
const cashLimit = 100000;

const buyLevels = [200, 1500, 4000, 6000];
const sellLevels = [200, 1500, 4000, 6000];
let cash = originalCash;
let globalQty = 0;
let lastPrice = 0;
const rsiStats = {
    '<40': 0,
    '40-45': 0,
    '45-50': 0,
    '60-65': 0,
    '65-70': 0,
    '>70': 0,
    '50-60': 0
};
function process() {
    const data = prepareData(yearsToProcess);
    let currentMonth = -1;
    let prevMonth = -1;
    for (let i = 0; i < data.length; i++) {
        const c = data[i];
        const date = new Date(c.date);
        const last = c.last;
        const rsi = Math.round(c.rsi);
        lastPrice = last;
        let calcQty = (level) => Math.round(level / last);

        if (rsi <= 55) {
            buyZone(date, last, rsi);
        }
        else if (rsi > 55) {
            sellZone(date, last, rsi);
        }
        else {
            rsiStats['50-60'] += 1;
            log('hold..')
        }

        //Month change
        currentMonth = date.getMonth();
        if (prevMonth !== currentMonth) {
            prevMonth = currentMonth;
            if (hasCashLimit && originalCash >= cashLimit) {
                const prevCash = cash;
                cash -= cashTakeout;
                log(`No more cash added! Cash Takeout: ${cashTakeout} PrevCash: ${formatCash(prevCash)} NewCash: ${formatCash(cash)}`);
                continue;
            }

            // const qty = calcQty(monthlyAdd);
            // buy(date, last, rsi, qty);
            originalCash += monthlyAdd;
            cash += monthlyAdd;
        }
    }

    log(`TQQQ-DCA TAKEOUT`);
    log(`YEARS: ${yearsToProcess}`);
    log(`ORIGINAL CASH: ${originalCash}`);
    log(`MONTHLY ADD: ${monthlyAdd}`);
    log(`CASH TAKEOUT: ${cashTakeout}`);
    
    log(`BUY LEVELS: ${buyLevels}`);
    log(`SELL LEVELS: ${sellLevels}`);

    log(`Cash Left: $${formatCash(cash)}`);
    const sum = lastPrice * globalQty;
    log(`Final: Last Price:${lastPrice} GlobalQty:${globalQty} Equity Value:${sum} Total Value: ${cash + sum}(${formatCash(cash + sum)})  PctIncrease: ${percentIncrease(originalCash, cash + sum)}%`);
    log(`RsiStats: ${JSON.stringify(rsiStats)}`);
}

function formatCash(n) {
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
}

function buyZone(date, last, rsi) {
    const rsib = (lower, higher) => rsi > lower && rsi <= higher; //rsi between
    const rsil = (val) => rsi <= val; //rsi less than value
    const rsig = (val) => rsi >= val; //rsi greater than value
    let qty = 0;
    let calcQty = (level) => Math.round(level / last);

    // qty = calcQty(500);
    // buy(date, last, rsi, qty);

    const levels = buyLevels;
    if (rsib(50, 55))
        qty = calcQty(levels[0]);
    if (rsib(45, 50))
        qty = calcQty(levels[1]);
    else if (rsib(40, 45))
        qty = calcQty(levels[2]);
    else if (rsil(40))
        qty = calcQty(levels[3]);

    // qty =  Math.round((55 - rsi) * 100);
    buy(date, last, rsi, qty);
}

function sellZone(date, last, rsi) {
    const rsib = (lower, higher) => rsi >= lower && rsi <= higher; //rsi between
    const rsil = (val) => rsi <= val; //rsi less than value
    const rsig = (val) => rsi > val; //rsi greater than value
    let qty = 0;
    let calcQty = (level) => Math.round(level / last);

    const levels = sellLevels;
    if (rsib(55, 60))
        qty = calcQty(levels[0]);
    else if (rsib(60, 65))
        qty = calcQty(levels[1]);
    else if (rsib(65, 70))
        qty = calcQty(levels[2]);
    else if (rsig(70))
        qty = calcQty(levels[3]);

    // qty = Math.round((rsi - 55) * 100);
    sell(date, last, rsi, qty);
}

function buy(date, last, rsi, qty) {
    buildRsiStats(rsi);
    const buyTotal = qty * last;
    if (buyTotal > cash) {
        log(`Buy: Not Enough Cash!`);
        return; //not enough cash to buy
    }
    globalQty += qty;
    cash = cash - buyTotal;
    const totalValue = Math.round((last * globalQty) + cash);
    log(`Buy: ${qty} * ${last} = ${buyTotal} on ${date.toLocaleDateString("en-US")} cash: $${cash} rsi: ${rsi} qty: ${qty} globalQty:${globalQty} totalValue: ${formatCash(totalValue)}`);
}

function sell(date, last, rsi, qty) {
    buildRsiStats(rsi);
    if (qty > globalQty) {
        log(`Sell: No Shares to Sell!`);
        return false; //nothing to sell
    }
    globalQty -= qty;
    const soldTotal = qty * last;

    cash = cash + soldTotal;
    const daysHold = 0;//Math.ceil((date - found.date) / 8.64e7);
    const totalValue = Math.round((last * globalQty) + cash);
    log(`Sell: ${qty} * ${last} = ${soldTotal} on ${date.toLocaleDateString("en-US")} cash: $${cash} rsi: ${rsi} qty: ${qty} globalQty:${globalQty} totalValue: ${formatCash(totalValue)}`);
    return true;
}

function buildRsiStats(rsi) {
    const rsib = (lower, higher) => rsi > lower && rsi <= higher; //rsi between
    const rsil = (val) => rsi <= val; //rsi less than value
    const rsig = (val) => rsi >= val; //rsi greater than value
    if (rsib(45, 50))
        rsiStats['45-50'] += 1;
    else if (rsib(40, 45))
        rsiStats['40-45'] += 1;
    else if (rsil(40))
        rsiStats['<40'] += 1;
    else if (rsib(60, 65))
        rsiStats['60-65'] += 1;
    else if (rsib(65, 70))
        rsiStats['65-70'] += 1;
    else if (rsig(70))
        rsiStats['>70'] += 1;
}

function log(msg) {
    console.log(msg);
}

function prepareData(yearsToProcess) {
    const _data = [];
    yearsToProcess.map(c => _data.push(...yearlyData[c]));
    return _data;
}

//price increased from 100(initialAmt) to 110(finalAmt), what percent increased: 110%
function percentIncrease(initialAmt, finalAmt) {
    return parseFloat((((finalAmt - initialAmt) / initialAmt) * 100).toFixed(2));
}

setTimeout(() => { process() }, 100);

const yearlyData = {
    "2016": [
        {
            "date": "1/4/2016",
            "last": 8.9375,
            "rsi": 40.0913951
        },
        {
            "date": "1/5/2016",
            "last": 8.8575,
            "rsi": 39.2387226
        },
        {
            "date": "1/6/2016",
            "last": 8.62,
            "rsi": 36.74048208
        },
        {
            "date": "1/7/2016",
            "last": 7.8,
            "rsi": 29.70775004
        },
        {
            "date": "1/8/2016",
            "last": 7.615833,
            "rsi": 28.39320265
        },
        {
            "date": "1/11/2016",
            "last": 7.6825,
            "rsi": 29.60747694
        },
        {
            "date": "1/12/2016",
            "last": 7.941667,
            "rsi": 34.27359678
        },
        {
            "date": "1/13/2016",
            "last": 7.110833,
            "rsi": 27.8908173
        },
        {
            "date": "1/14/2016",
            "last": 7.570833,
            "rsi": 35.09756626
        },
        {
            "date": "1/15/2016",
            "last": 6.875,
            "rsi": 30.18340966
        },
        {
            "date": "1/19/2016",
            "last": 6.904167,
            "rsi": 30.6219058
        },
        {
            "date": "1/20/2016",
            "last": 6.841667,
            "rsi": 30.18442104
        },
        {
            "date": "1/21/2016",
            "last": 6.866667,
            "rsi": 30.61145574
        },
        {
            "date": "1/22/2016",
            "last": 7.458333,
            "rsi": 39.96985378
        },
        {
            "date": "1/25/2016",
            "last": 7.1225,
            "rsi": 36.92565256
        },
        {
            "date": "1/26/2016",
            "last": 7.325833,
            "rsi": 39.90975648
        },
        {
            "date": "1/27/2016",
            "last": 6.780833,
            "rsi": 35.11441119
        },
        {
            "date": "1/28/2016",
            "last": 7.048333,
            "rsi": 38.98929611
        },
        {
            "date": "1/29/2016",
            "last": 7.5075,
            "rsi": 45.05486285
        },
        {
            "date": "2/1/2016",
            "last": 7.55,
            "rsi": 45.59401947
        },
        {
            "date": "2/2/2016",
            "last": 7.070833,
            "rsi": 40.74012143
        },
        {
            "date": "2/3/2016",
            "last": 6.970833,
            "rsi": 39.78812777
        },
        {
            "date": "2/4/2016",
            "last": 6.958333,
            "rsi": 39.66336186
        },
        {
            "date": "2/5/2016",
            "last": 6.2425,
            "rsi": 33.23594003
        },
        {
            "date": "2/8/2016",
            "last": 5.9575,
            "rsi": 31.07670428
        },
        {
            "date": "2/9/2016",
            "last": 5.888333,
            "rsi": 30.5578403
        },
        {
            "date": "2/10/2016",
            "last": 5.958333,
            "rsi": 31.79890295
        },
        {
            "date": "2/11/2016",
            "last": 5.944167,
            "rsi": 31.67552765
        },
        {
            "date": "2/12/2016",
            "last": 6.1975,
            "rsi": 36.42587832
        },
        {
            "date": "2/16/2016",
            "last": 6.61,
            "rsi": 43.33440879
        },
        {
            "date": "2/17/2016",
            "last": 7.066667,
            "rsi": 49.83385558
        },
        {
            "date": "2/18/2016",
            "last": 6.826667,
            "rsi": 46.79603368
        },
        {
            "date": "2/19/2016",
            "last": 6.8975,
            "rsi": 47.80727971
        },
        {
            "date": "2/22/2016",
            "last": 7.223333,
            "rsi": 52.29873264
        },
        {
            "date": "2/23/2016",
            "last": 6.863333,
            "rsi": 47.44110894
        },
        {
            "date": "2/24/2016",
            "last": 7.0675,
            "rsi": 50.26262972
        },
        {
            "date": "2/25/2016",
            "last": 7.2625,
            "rsi": 52.86525685
        },
        {
            "date": "2/26/2016",
            "last": 7.245833,
            "rsi": 52.61184892
        },
        {
            "date": "2/29/2016",
            "last": 7.054167,
            "rsi": 49.66362413
        },
        {
            "date": "3/1/2016",
            "last": 7.729167,
            "rsi": 58.48649308
        },
        {
            "date": "3/2/2016",
            "last": 7.7375,
            "rsi": 58.58300674
        },
        {
            "date": "3/3/2016",
            "last": 7.694167,
            "rsi": 57.8300758
        },
        {
            "date": "3/4/2016",
            "last": 7.7075,
            "rsi": 58.00890338
        },
        {
            "date": "3/7/2016",
            "last": 7.564167,
            "rsi": 55.2942484
        },
        {
            "date": "3/8/2016",
            "last": 7.364167,
            "rsi": 51.66134241
        },
        {
            "date": "3/9/2016",
            "last": 7.505,
            "rsi": 53.95543878
        },
        {
            "date": "3/10/2016",
            "last": 7.476667,
            "rsi": 53.40629967
        },
        {
            "date": "3/11/2016",
            "last": 7.864167,
            "rsi": 59.48032901
        },
        {
            "date": "3/14/2016",
            "last": 7.91,
            "rsi": 60.1421714
        },
        {
            "date": "3/15/2016",
            "last": 7.905,
            "rsi": 60.02698225
        },
        {
            "date": "3/16/2016",
            "last": 8.106667,
            "rsi": 63.09701816
        },
        {
            "date": "3/17/2016",
            "last": 8.083333,
            "rsi": 62.49889871
        },
        {
            "date": "3/18/2016",
            "last": 8.13,
            "rsi": 63.24922635
        },
        {
            "date": "3/21/2016",
            "last": 8.226667,
            "rsi": 64.81945372
        },
        {
            "date": "3/22/2016",
            "last": 8.3,
            "rsi": 66.00605159
        },
        {
            "date": "3/23/2016",
            "last": 8.1025,
            "rsi": 60.12434108
        },
        {
            "date": "3/24/2016",
            "last": 8.1,
            "rsi": 60.05139523
        },
        {
            "date": "3/28/2016",
            "last": 8.070833,
            "rsi": 59.14974199
        },
        {
            "date": "3/29/2016",
            "last": 8.456667,
            "rsi": 66.34790896
        },
        {
            "date": "3/30/2016",
            "last": 8.583333,
            "rsi": 68.32140932
        },
        {
            "date": "3/31/2016",
            "last": 8.533333,
            "rsi": 66.65959515
        },
        {
            "date": "4/1/2016",
            "last": 8.8175,
            "rsi": 70.97988679
        },
        {
            "date": "4/4/2016",
            "last": 8.708333,
            "rsi": 67.36828307
        },
        {
            "date": "4/5/2016",
            "last": 8.474167,
            "rsi": 60.28271407
        },
        {
            "date": "4/6/2016",
            "last": 8.88,
            "rsi": 66.79998452
        },
        {
            "date": "4/7/2016",
            "last": 8.496667,
            "rsi": 57.24486266
        },
        {
            "date": "4/8/2016",
            "last": 8.476667,
            "rsi": 56.7884493
        },
        {
            "date": "4/11/2016",
            "last": 8.385833,
            "rsi": 54.65702011
        },
        {
            "date": "4/12/2016",
            "last": 8.581667,
            "rsi": 58.29163501
        },
        {
            "date": "4/13/2016",
            "last": 8.916667,
            "rsi": 63.65819765
        },
        {
            "date": "4/14/2016",
            "last": 8.9225,
            "rsi": 63.74566879
        },
        {
            "date": "4/15/2016",
            "last": 8.854167,
            "rsi": 61.86704048
        },
        {
            "date": "4/18/2016",
            "last": 8.985,
            "rsi": 64.05149264
        },
        {
            "date": "4/19/2016",
            "last": 8.83,
            "rsi": 59.68899342
        },
        {
            "date": "4/20/2016",
            "last": 8.851667,
            "rsi": 60.09811398
        },
        {
            "date": "4/21/2016",
            "last": 8.854167,
            "rsi": 60.14837133
        },
        {
            "date": "4/22/2016",
            "last": 8.453333,
            "rsi": 49.40407014
        },
        {
            "date": "4/25/2016",
            "last": 8.446667,
            "rsi": 49.24652127
        },
        {
            "date": "4/26/2016",
            "last": 8.330833,
            "rsi": 46.47313737
        },
        {
            "date": "4/27/2016",
            "last": 8.130833,
            "rsi": 42.0679498
        },
        {
            "date": "4/28/2016",
            "last": 7.8425,
            "rsi": 36.67115355
        },
        {
            "date": "4/29/2016",
            "last": 7.7175,
            "rsi": 34.5988801
        },
        {
            "date": "5/2/2016",
            "last": 7.921667,
            "rsi": 40.51194293
        },
        {
            "date": "5/3/2016",
            "last": 7.710833,
            "rsi": 36.81074973
        },
        {
            "date": "5/4/2016",
            "last": 7.558333,
            "rsi": 34.36512146
        },
        {
            "date": "5/5/2016",
            "last": 7.554167,
            "rsi": 34.29808366
        },
        {
            "date": "5/6/2016",
            "last": 7.663333,
            "rsi": 37.7262336
        },
        {
            "date": "5/9/2016",
            "last": 7.730833,
            "rsi": 39.81723799
        },
        {
            "date": "5/10/2016",
            "last": 8.055,
            "rsi": 48.72214476
        },
        {
            "date": "5/11/2016",
            "last": 7.835,
            "rsi": 43.96740593
        },
        {
            "date": "5/12/2016",
            "last": 7.725,
            "rsi": 41.77235828
        },
        {
            "date": "5/13/2016",
            "last": 7.631667,
            "rsi": 39.94990629
        },
        {
            "date": "5/16/2016",
            "last": 7.925833,
            "rsi": 47.69539713
        },
        {
            "date": "5/17/2016",
            "last": 7.621667,
            "rsi": 41.70535409
        },
        {
            "date": "5/18/2016",
            "last": 7.708333,
            "rsi": 43.86848598
        },
        {
            "date": "5/19/2016",
            "last": 7.586667,
            "rsi": 41.53821045
        },
        {
            "date": "5/20/2016",
            "last": 7.84,
            "rsi": 47.76063625
        },
        {
            "date": "5/23/2016",
            "last": 7.801667,
            "rsi": 46.9463904
        },
        {
            "date": "5/24/2016",
            "last": 8.279167,
            "rsi": 56.82143202
        },
        {
            "date": "5/25/2016",
            "last": 8.4575,
            "rsi": 59.82876942
        },
        {
            "date": "5/26/2016",
            "last": 8.528333,
            "rsi": 60.99093515
        },
        {
            "date": "5/27/2016",
            "last": 8.656667,
            "rsi": 63.07524068
        },
        {
            "date": "5/31/2016",
            "last": 8.708333,
            "rsi": 63.91125819
        },
        {
            "date": "6/1/2016",
            "last": 8.711667,
            "rsi": 63.96795154
        },
        {
            "date": "6/2/2016",
            "last": 8.760833,
            "rsi": 64.84501542
        },
        {
            "date": "6/3/2016",
            "last": 8.640833,
            "rsi": 60.94571662
        },
        {
            "date": "6/6/2016",
            "last": 8.733333,
            "rsi": 62.80253095
        },
        {
            "date": "6/7/2016",
            "last": 8.671667,
            "rsi": 60.72958099
        },
        {
            "date": "6/8/2016",
            "last": 8.71,
            "rsi": 61.57856013
        },
        {
            "date": "6/9/2016",
            "last": 8.671667,
            "rsi": 60.17752037
        },
        {
            "date": "6/10/2016",
            "last": 8.38,
            "rsi": 50.72143046
        },
        {
            "date": "6/13/2016",
            "last": 8.165,
            "rsi": 45.09605281
        },
        {
            "date": "6/14/2016",
            "last": 8.169167,
            "rsi": 45.22285575
        },
        {
            "date": "6/15/2016",
            "last": 8.095833,
            "rsi": 43.32639087
        },
        {
            "date": "6/16/2016",
            "last": 8.154167,
            "rsi": 45.29174471
        },
        {
            "date": "6/17/2016",
            "last": 7.875,
            "rsi": 38.42433113
        },
        {
            "date": "6/20/2016",
            "last": 8.016667,
            "rsi": 43.13626148
        },
        {
            "date": "6/21/2016",
            "last": 8.096667,
            "rsi": 45.66484113
        },
        {
            "date": "6/22/2016",
            "last": 8.044167,
            "rsi": 44.27348304
        },
        {
            "date": "6/23/2016",
            "last": 8.383333,
            "rsi": 54.02026259
        },
        {
            "date": "6/24/2016",
            "last": 7.356667,
            "rsi": 34.40418784
        },
        {
            "date": "6/27/2016",
            "last": 6.928333,
            "rsi": 29.57840074
        },
        {
            "date": "6/28/2016",
            "last": 7.3625,
            "rsi": 38.92921248
        },
        {
            "date": "6/29/2016",
            "last": 7.745,
            "rsi": 45.76211867
        },
        {
            "date": "6/30/2016",
            "last": 8.026667,
            "rsi": 50.18234429
        },
        {
            "date": "7/1/2016",
            "last": 8.136667,
            "rsi": 51.83328012
        },
        {
            "date": "7/5/2016",
            "last": 7.9925,
            "rsi": 49.51716298
        },
        {
            "date": "7/6/2016",
            "last": 8.180833,
            "rsi": 52.5029816
        },
        {
            "date": "7/7/2016",
            "last": 8.258333,
            "rsi": 53.71611738
        },
        {
            "date": "7/8/2016",
            "last": 8.64,
            "rsi": 59.23776454
        },
        {
            "date": "7/11/2016",
            "last": 8.7875,
            "rsi": 61.16592818
        },
        {
            "date": "7/12/2016",
            "last": 8.925833,
            "rsi": 62.93664489
        },
        {
            "date": "7/13/2016",
            "last": 8.863333,
            "rsi": 61.57065085
        },
        {
            "date": "7/14/2016",
            "last": 9.043333,
            "rsi": 63.99442495
        },
        {
            "date": "7/15/2016",
            "last": 8.9925,
            "rsi": 62.79000607
        },
        {
            "date": "7/18/2016",
            "last": 9.171667,
            "rsi": 65.27099443
        },
        {
            "date": "7/19/2016",
            "last": 9.076667,
            "rsi": 62.87708458
        },
        {
            "date": "7/20/2016",
            "last": 9.3875,
            "rsi": 67.12556878
        },
        {
            "date": "7/21/2016",
            "last": 9.331667,
            "rsi": 65.67172127
        },
        {
            "date": "7/22/2016",
            "last": 9.44,
            "rsi": 67.15804814
        },
        {
            "date": "7/25/2016",
            "last": 9.448333,
            "rsi": 67.27541938
        },
        {
            "date": "7/26/2016",
            "last": 9.48,
            "rsi": 67.74714676
        },
        {
            "date": "7/27/2016",
            "last": 9.665,
            "rsi": 70.42898581
        },
        {
            "date": "7/28/2016",
            "last": 9.77,
            "rsi": 71.85920684
        },
        {
            "date": "7/29/2016",
            "last": 9.834167,
            "rsi": 72.72731135
        },
        {
            "date": "8/1/2016",
            "last": 9.988333,
            "rsi": 74.74323875
        },
        {
            "date": "8/2/2016",
            "last": 9.763333,
            "rsi": 66.96352145
        },
        {
            "date": "8/3/2016",
            "last": 9.855833,
            "rsi": 68.41885863
        },
        {
            "date": "8/4/2016",
            "last": 9.944167,
            "rsi": 69.78761373
        },
        {
            "date": "8/5/2016",
            "last": 10.231667,
            "rsi": 73.77197057
        },
        {
            "date": "8/8/2016",
            "last": 10.199167,
            "rsi": 72.60629506
        },
        {
            "date": "8/9/2016",
            "last": 10.266667,
            "rsi": 73.54139561
        },
        {
            "date": "8/10/2016",
            "last": 10.1875,
            "rsi": 70.5016857
        },
        {
            "date": "8/11/2016",
            "last": 10.319167,
            "rsi": 72.5349686
        },
        {
            "date": "8/12/2016",
            "last": 10.338333,
            "rsi": 72.82856613
        },
        {
            "date": "8/15/2016",
            "last": 10.468333,
            "rsi": 74.7965807
        },
        {
            "date": "8/16/2016",
            "last": 10.303333,
            "rsi": 68.0586808
        },
        {
            "date": "8/17/2016",
            "last": 10.351667,
            "rsi": 68.94131223
        },
        {
            "date": "8/18/2016",
            "last": 10.361667,
            "rsi": 69.13136575
        },
        {
            "date": "8/19/2016",
            "last": 10.3475,
            "rsi": 68.49193311
        },
        {
            "date": "8/22/2016",
            "last": 10.3575,
            "rsi": 68.71192431
        },
        {
            "date": "8/23/2016",
            "last": 10.419167,
            "rsi": 70.09840982
        },
        {
            "date": "8/24/2016",
            "last": 10.218333,
            "rsi": 60.66922721
        },
        {
            "date": "8/25/2016",
            "last": 10.17,
            "rsi": 58.62540582
        },
        {
            "date": "8/26/2016",
            "last": 10.219167,
            "rsi": 60.0980023
        },
        {
            "date": "8/29/2016",
            "last": 10.2475,
            "rsi": 60.96030542
        },
        {
            "date": "8/30/2016",
            "last": 10.155,
            "rsi": 56.6556131
        },
        {
            "date": "8/31/2016",
            "last": 10.128333,
            "rsi": 55.44016448
        },
        {
            "date": "9/1/2016",
            "last": 10.173333,
            "rsi": 57.1122184
        },
        {
            "date": "9/2/2016",
            "last": 10.2925,
            "rsi": 61.25809048
        },
        {
            "date": "9/6/2016",
            "last": 10.483333,
            "rsi": 66.79391314
        },
        {
            "date": "9/7/2016",
            "last": 10.5025,
            "rsi": 67.29932246
        },
        {
            "date": "9/8/2016",
            "last": 10.3225,
            "rsi": 58.32174606
        },
        {
            "date": "9/9/2016",
            "last": 9.54,
            "rsi": 35.9009546
        },
        {
            "date": "9/12/2016",
            "last": 10.029167,
            "rsi": 49.07957454
        },
        {
            "date": "9/13/2016",
            "last": 9.7925,
            "rsi": 44.33072467
        },
        {
            "date": "9/14/2016",
            "last": 9.918333,
            "rsi": 47.25303705
        },
        {
            "date": "9/15/2016",
            "last": 10.378333,
            "rsi": 56.28685076
        },
        {
            "date": "9/16/2016",
            "last": 10.366667,
            "rsi": 56.02478956
        },
        {
            "date": "9/19/2016",
            "last": 10.230833,
            "rsi": 52.93445549
        },
        {
            "date": "9/20/2016",
            "last": 10.2875,
            "rsi": 54.07261551
        },
        {
            "date": "9/21/2016",
            "last": 10.586667,
            "rsi": 59.62389177
        },
        {
            "date": "9/22/2016",
            "last": 10.834167,
            "rsi": 63.54920512
        },
        {
            "date": "9/23/2016",
            "last": 10.639167,
            "rsi": 58.70658106
        },
        {
            "date": "9/26/2016",
            "last": 10.375,
            "rsi": 52.83298084
        },
        {
            "date": "9/27/2016",
            "last": 10.669167,
            "rsi": 57.88592949
        },
        {
            "date": "9/28/2016",
            "last": 10.7275,
            "rsi": 58.82785168
        },
        {
            "date": "9/29/2016",
            "last": 10.5,
            "rsi": 53.77623943
        },
        {
            "date": "9/30/2016",
            "last": 10.715833,
            "rsi": 57.50453815
        },
        {
            "date": "10/3/2016",
            "last": 10.691667,
            "rsi": 56.95065803
        },
        {
            "date": "10/4/2016",
            "last": 10.630833,
            "rsi": 55.50140595
        },
        {
            "date": "10/5/2016",
            "last": 10.741667,
            "rsi": 57.61753763
        },
        {
            "date": "10/6/2016",
            "last": 10.725,
            "rsi": 57.17719739
        },
        {
            "date": "10/7/2016",
            "last": 10.655,
            "rsi": 55.26680182
        },
        {
            "date": "10/10/2016",
            "last": 10.845833,
            "rsi": 59.26285406
        },
        {
            "date": "10/11/2016",
            "last": 10.3975,
            "rsi": 48.33787374
        },
        {
            "date": "10/12/2016",
            "last": 10.375833,
            "rsi": 47.87850499
        },
        {
            "date": "10/13/2016",
            "last": 10.254167,
            "rsi": 45.27653541
        },
        {
            "date": "10/14/2016",
            "last": 10.2775,
            "rsi": 45.88393415
        },
        {
            "date": "10/17/2016",
            "last": 10.206667,
            "rsi": 44.27724939
        },
        {
            "date": "10/18/2016",
            "last": 10.468333,
            "rsi": 51.09057198
        },
        {
            "date": "10/19/2016",
            "last": 10.4725,
            "rsi": 51.1929178
        },
        {
            "date": "10/20/2016",
            "last": 10.428333,
            "rsi": 49.99866828
        },
        {
            "date": "10/21/2016",
            "last": 10.541667,
            "rsi": 53.02684963
        },
        {
            "date": "10/24/2016",
            "last": 10.925833,
            "rsi": 61.53137954
        },
        {
            "date": "10/25/2016",
            "last": 10.816667,
            "rsi": 58.3011675
        },
        {
            "date": "10/26/2016",
            "last": 10.609167,
            "rsi": 52.6440046
        },
        {
            "date": "10/27/2016",
            "last": 10.460833,
            "rsi": 48.98477358
        },
        {
            "date": "10/28/2016",
            "last": 10.28,
            "rsi": 44.8884247
        },
        {
            "date": "10/31/2016",
            "last": 10.221667,
            "rsi": 43.62119683
        },
        {
            "date": "11/1/2016",
            "last": 10.011667,
            "rsi": 39.31790867
        },
        {
            "date": "11/2/2016",
            "last": 9.750833,
            "rsi": 34.73445421
        },
        {
            "date": "11/3/2016",
            "last": 9.47,
            "rsi": 30.59853735
        },
        {
            "date": "11/4/2016",
            "last": 9.3625,
            "rsi": 29.16685733
        },
        {
            "date": "11/7/2016",
            "last": 10.033333,
            "rsi": 46.11148862
        },
        {
            "date": "11/8/2016",
            "last": 10.23,
            "rsi": 49.89567555
        },
        {
            "date": "11/9/2016",
            "last": 10.373333,
            "rsi": 52.51295972
        },
        {
            "date": "11/10/2016",
            "last": 9.88,
            "rsi": 43.99463739
        },
        {
            "date": "11/11/2016",
            "last": 9.871667,
            "rsi": 43.86520183
        },
        {
            "date": "11/14/2016",
            "last": 9.538333,
            "rsi": 38.93104613
        },
        {
            "date": "11/15/2016",
            "last": 9.98,
            "rsi": 47.37732908
        },
        {
            "date": "11/16/2016",
            "last": 10.1425,
            "rsi": 50.11127934
        },
        {
            "date": "11/17/2016",
            "last": 10.3775,
            "rsi": 53.84574642
        },
        {
            "date": "11/18/2016",
            "last": 10.260833,
            "rsi": 51.77369614
        },
        {
            "date": "11/21/2016",
            "last": 10.569167,
            "rsi": 56.53421693
        },
        {
            "date": "11/22/2016",
            "last": 10.664167,
            "rsi": 57.91272148
        },
        {
            "date": "11/23/2016",
            "last": 10.535833,
            "rsi": 55.35856035
        },
        {
            "date": "11/25/2016",
            "last": 10.6375,
            "rsi": 56.97736443
        },
        {
            "date": "11/28/2016",
            "last": 10.578333,
            "rsi": 55.71122073
        },
        {
            "date": "11/29/2016",
            "last": 10.68,
            "rsi": 57.46049619
        },
        {
            "date": "11/30/2016",
            "last": 10.334167,
            "rsi": 50.19747264
        },
        {
            "date": "12/1/2016",
            "last": 9.766667,
            "rsi": 41.03199969
        },
        {
            "date": "12/2/2016",
            "last": 9.805833,
            "rsi": 41.82152023
        },
        {
            "date": "12/5/2016",
            "last": 10.0325,
            "rsi": 46.30242265
        },
        {
            "date": "12/6/2016",
            "last": 10.105,
            "rsi": 47.69020242
        },
        {
            "date": "12/7/2016",
            "last": 10.48,
            "rsi": 54.27307965
        },
        {
            "date": "12/8/2016",
            "last": 10.544167,
            "rsi": 55.30944671
        },
        {
            "date": "12/9/2016",
            "last": 10.790833,
            "rsi": 59.14291006
        },
        {
            "date": "12/12/2016",
            "last": 10.640833,
            "rsi": 55.99726957
        },
        {
            "date": "12/13/2016",
            "last": 11.056667,
            "rsi": 62.02696201
        },
        {
            "date": "12/14/2016",
            "last": 10.975833,
            "rsi": 60.29725776
        },
        {
            "date": "12/15/2016",
            "last": 11.0425,
            "rsi": 61.2568523
        },
        {
            "date": "12/16/2016",
            "last": 10.908333,
            "rsi": 58.2077796
        },
        {
            "date": "12/19/2016",
            "last": 11.041667,
            "rsi": 60.3215032
        },
        {
            "date": "12/20/2016",
            "last": 11.175,
            "rsi": 62.37104301
        },
        {
            "date": "12/21/2016",
            "last": 11.135833,
            "rsi": 61.36824789
        },
        {
            "date": "12/22/2016",
            "last": 11.039167,
            "rsi": 58.85324915
        },
        {
            "date": "12/23/2016",
            "last": 11.073333,
            "rsi": 59.48524229
        },
        {
            "date": "12/27/2016",
            "last": 11.235,
            "rsi": 62.42610633
        },
        {
            "date": "12/28/2016",
            "last": 10.975,
            "rsi": 55.45446732
        },
        {
            "date": "12/29/2016",
            "last": 10.921667,
            "rsi": 54.1193226
        },
        {
            "date": "12/30/2016",
            "last": 10.6025,
            "rsi": 46.84979553
        }
    ],
    "2017": [
        {
            "date": "1/3/2017",
            "last": 10.859167,
            "rsi": 52.38077679
        },
        {
            "date": "1/4/2017",
            "last": 11.044167,
            "rsi": 55.93831926
        },
        {
            "date": "1/5/2017",
            "last": 11.24,
            "rsi": 59.39637088
        },
        {
            "date": "1/6/2017",
            "last": 11.525,
            "rsi": 63.84368896
        },
        {
            "date": "1/9/2017",
            "last": 11.641667,
            "rsi": 65.50911566
        },
        {
            "date": "1/10/2017",
            "last": 11.708333,
            "rsi": 66.45982505
        },
        {
            "date": "1/11/2017",
            "last": 11.798333,
            "rsi": 67.75213651
        },
        {
            "date": "1/12/2017",
            "last": 11.738333,
            "rsi": 65.92837654
        },
        {
            "date": "1/13/2017",
            "last": 11.873333,
            "rsi": 68.01461284
        },
        {
            "date": "1/17/2017",
            "last": 11.761667,
            "rsi": 64.49673869
        },
        {
            "date": "1/18/2017",
            "last": 11.841667,
            "rsi": 65.85914357
        },
        {
            "date": "1/19/2017",
            "last": 11.81,
            "rsi": 64.79913646
        },
        {
            "date": "1/20/2017",
            "last": 11.886667,
            "rsi": 66.2168205
        },
        {
            "date": "1/23/2017",
            "last": 11.913333,
            "rsi": 66.71888338
        },
        {
            "date": "1/24/2017",
            "last": 12.161667,
            "rsi": 71.03587318
        },
        {
            "date": "1/25/2017",
            "last": 12.516667,
            "rsi": 75.85702466
        },
        {
            "date": "1/26/2017",
            "last": 12.568333,
            "rsi": 76.47086782
        },
        {
            "date": "1/27/2017",
            "last": 12.628333,
            "rsi": 77.19598636
        },
        {
            "date": "1/30/2017",
            "last": 12.341667,
            "rsi": 66.63057769
        },
        {
            "date": "1/31/2017",
            "last": 12.273333,
            "rsi": 64.36898908
        },
        {
            "date": "2/1/2017",
            "last": 12.506667,
            "rsi": 68.32277398
        },
        {
            "date": "2/2/2017",
            "last": 12.475,
            "rsi": 67.23239603
        },
        {
            "date": "2/3/2017",
            "last": 12.583333,
            "rsi": 69.05202301
        },
        {
            "date": "2/6/2017",
            "last": 12.63,
            "rsi": 69.82926695
        },
        {
            "date": "2/7/2017",
            "last": 12.76,
            "rsi": 71.94315535
        },
        {
            "date": "2/8/2017",
            "last": 12.831667,
            "rsi": 73.0636146
        },
        {
            "date": "2/9/2017",
            "last": 12.965,
            "rsi": 75.05920175
        },
        {
            "date": "2/10/2017",
            "last": 13.093333,
            "rsi": 76.83787115
        },
        {
            "date": "2/13/2017",
            "last": 13.323333,
            "rsi": 79.64027638
        },
        {
            "date": "2/14/2017",
            "last": 13.448333,
            "rsi": 80.98668582
        },
        {
            "date": "2/15/2017",
            "last": 13.68,
            "rsi": 83.20365159
        },
        {
            "date": "2/16/2017",
            "last": 13.668333,
            "rsi": 82.6807915
        },
        {
            "date": "2/17/2017",
            "last": 13.84,
            "rsi": 84.24919619
        },
        {
            "date": "2/21/2017",
            "last": 14.06,
            "rsi": 85.99907284
        },
        {
            "date": "2/22/2017",
            "last": 14.061667,
            "rsi": 86.0117542
        },
        {
            "date": "2/23/2017",
            "last": 13.91,
            "rsi": 79.00075085
        },
        {
            "date": "2/24/2017",
            "last": 13.985,
            "rsi": 79.87437879
        },
        {
            "date": "2/27/2017",
            "last": 14.026667,
            "rsi": 80.36315505
        },
        {
            "date": "2/28/2017",
            "last": 13.916667,
            "rsi": 75.17269254
        },
        {
            "date": "3/1/2017",
            "last": 14.366667,
            "rsi": 80.67232046
        },
        {
            "date": "3/2/2017",
            "last": 14.14,
            "rsi": 72.0184939
        },
        {
            "date": "3/3/2017",
            "last": 14.213333,
            "rsi": 73.02661998
        },
        {
            "date": "3/6/2017",
            "last": 14.115,
            "rsi": 69.41516155
        },
        {
            "date": "3/7/2017",
            "last": 14.045,
            "rsi": 66.87957545
        },
        {
            "date": "3/8/2017",
            "last": 14.116667,
            "rsi": 68.16184062
        },
        {
            "date": "3/9/2017",
            "last": 14.16,
            "rsi": 68.94473188
        },
        {
            "date": "3/10/2017",
            "last": 14.315,
            "rsi": 71.63182387
        },
        {
            "date": "3/13/2017",
            "last": 14.398333,
            "rsi": 72.98520148
        },
        {
            "date": "3/14/2017",
            "last": 14.291667,
            "rsi": 68.48164677
        },
        {
            "date": "3/15/2017",
            "last": 14.541667,
            "rsi": 72.7290169
        },
        {
            "date": "3/16/2017",
            "last": 14.533333,
            "rsi": 72.37885694
        },
        {
            "date": "3/17/2017",
            "last": 14.498333,
            "rsi": 70.83639504
        },
        {
            "date": "3/20/2017",
            "last": 14.541667,
            "rsi": 71.6421833
        },
        {
            "date": "3/21/2017",
            "last": 13.893333,
            "rsi": 49.57323311
        },
        {
            "date": "3/22/2017",
            "last": 14.166667,
            "rsi": 55.76054705
        },
        {
            "date": "3/23/2017",
            "last": 14.053333,
            "rsi": 52.8641789
        },
        {
            "date": "3/24/2017",
            "last": 14.13,
            "rsi": 54.58279958
        },
        {
            "date": "3/27/2017",
            "last": 14.205,
            "rsi": 56.26282988
        },
        {
            "date": "3/28/2017",
            "last": 14.471667,
            "rsi": 61.68921375
        },
        {
            "date": "3/29/2017",
            "last": 14.663333,
            "rsi": 65.04595427
        },
        {
            "date": "3/30/2017",
            "last": 14.736667,
            "rsi": 66.26392334
        },
        {
            "date": "3/31/2017",
            "last": 14.701667,
            "rsi": 65.09804269
        },
        {
            "date": "4/3/2017",
            "last": 14.67,
            "rsi": 64.0008417
        },
        {
            "date": "4/4/2017",
            "last": 14.736667,
            "rsi": 65.32583284
        },
        {
            "date": "4/5/2017",
            "last": 14.568333,
            "rsi": 59.38256633
        },
        {
            "date": "4/6/2017",
            "last": 14.58,
            "rsi": 59.65652534
        },
        {
            "date": "4/7/2017",
            "last": 14.563333,
            "rsi": 59.04384958
        },
        {
            "date": "4/10/2017",
            "last": 14.58,
            "rsi": 59.49187185
        },
        {
            "date": "4/11/2017",
            "last": 14.396667,
            "rsi": 52.66710514
        },
        {
            "date": "4/12/2017",
            "last": 14.206667,
            "rsi": 46.68925822
        },
        {
            "date": "4/13/2017",
            "last": 14.038333,
            "rsi": 42.12710485
        },
        {
            "date": "4/17/2017",
            "last": 14.371667,
            "rsi": 52.10683692
        },
        {
            "date": "4/18/2017",
            "last": 14.33,
            "rsi": 50.92469555
        },
        {
            "date": "4/19/2017",
            "last": 14.38,
            "rsi": 52.32251318
        },
        {
            "date": "4/20/2017",
            "last": 14.728333,
            "rsi": 60.71711638
        },
        {
            "date": "4/21/2017",
            "last": 14.721667,
            "rsi": 60.49759325
        },
        {
            "date": "4/24/2017",
            "last": 15.256667,
            "rsi": 69.90280089
        },
        {
            "date": "4/25/2017",
            "last": 15.595,
            "rsi": 74.10216516
        },
        {
            "date": "4/26/2017",
            "last": 15.526667,
            "rsi": 71.9195594
        },
        {
            "date": "4/27/2017",
            "last": 15.798333,
            "rsi": 75.06411109
        },
        {
            "date": "4/28/2017",
            "last": 15.888333,
            "rsi": 76.02209446
        },
        {
            "date": "5/1/2017",
            "last": 16.288334,
            "rsi": 79.74635141
        },
        {
            "date": "5/2/2017",
            "last": 16.385,
            "rsi": 80.53325075
        },
        {
            "date": "5/3/2017",
            "last": 16.223333,
            "rsi": 75.26641861
        },
        {
            "date": "5/4/2017",
            "last": 16.24,
            "rsi": 75.44471395
        },
        {
            "date": "5/5/2017",
            "last": 16.416668,
            "rsi": 77.31169603
        },
        {
            "date": "5/8/2017",
            "last": 16.514999,
            "rsi": 78.30061308
        },
        {
            "date": "5/9/2017",
            "last": 16.696667,
            "rsi": 80.03226023
        },
        {
            "date": "5/10/2017",
            "last": 16.723333,
            "rsi": 80.28100889
        },
        {
            "date": "5/11/2017",
            "last": 16.683332,
            "rsi": 78.69725003
        },
        {
            "date": "5/12/2017",
            "last": 16.791668,
            "rsi": 79.85629988
        },
        {
            "date": "5/15/2017",
            "last": 16.948334,
            "rsi": 81.42980964
        },
        {
            "date": "5/16/2017",
            "last": 17.161667,
            "rsi": 83.33840845
        },
        {
            "date": "5/17/2017",
            "last": 15.863333,
            "rsi": 49.79546557
        },
        {
            "date": "5/18/2017",
            "last": 16.264999,
            "rsi": 55.73171309
        },
        {
            "date": "5/19/2017",
            "last": 16.461666,
            "rsi": 58.32975535
        },
        {
            "date": "5/22/2017",
            "last": 16.888332,
            "rsi": 63.35451402
        },
        {
            "date": "5/23/2017",
            "last": 16.93,
            "rsi": 63.81343282
        },
        {
            "date": "5/24/2017",
            "last": 17.163334,
            "rsi": 66.35442522
        },
        {
            "date": "5/25/2017",
            "last": 17.615,
            "rsi": 70.65057691
        },
        {
            "date": "5/26/2017",
            "last": 17.690001,
            "rsi": 71.3057866
        },
        {
            "date": "5/30/2017",
            "last": 17.726667,
            "rsi": 71.63912211
        },
        {
            "date": "5/31/2017",
            "last": 17.705,
            "rsi": 71.11339713
        },
        {
            "date": "6/1/2017",
            "last": 17.916668,
            "rsi": 73.1837639
        },
        {
            "date": "6/2/2017",
            "last": 18.528334,
            "rsi": 78.07422295
        },
        {
            "date": "6/5/2017",
            "last": 18.513332,
            "rsi": 77.69994691
        },
        {
            "date": "6/6/2017",
            "last": 18.303333,
            "rsi": 72.46327832
        },
        {
            "date": "6/7/2017",
            "last": 18.503332,
            "rsi": 74.24366261
        },
        {
            "date": "6/8/2017",
            "last": 18.553333,
            "rsi": 74.68434554
        },
        {
            "date": "6/9/2017",
            "last": 17.211666,
            "rsi": 49.97559342
        },
        {
            "date": "6/12/2017",
            "last": 16.9,
            "rsi": 46.15549934
        },
        {
            "date": "6/13/2017",
            "last": 17.295,
            "rsi": 51.24237364
        },
        {
            "date": "6/14/2017",
            "last": 17.063334,
            "rsi": 48.35689448
        },
        {
            "date": "6/15/2017",
            "last": 16.833332,
            "rsi": 45.61083033
        },
        {
            "date": "6/16/2017",
            "last": 16.631666,
            "rsi": 43.28958292
        },
        {
            "date": "6/19/2017",
            "last": 17.436666,
            "rsi": 53.46940023
        },
        {
            "date": "6/20/2017",
            "last": 17.041668,
            "rsi": 48.8369635
        },
        {
            "date": "6/21/2017",
            "last": 17.536667,
            "rsi": 54.19285219
        },
        {
            "date": "6/22/2017",
            "last": 17.516666,
            "rsi": 53.94711239
        },
        {
            "date": "6/23/2017",
            "last": 17.713333,
            "rsi": 56.0571314
        },
        {
            "date": "6/26/2017",
            "last": 17.478333,
            "rsi": 52.93607042
        },
        {
            "date": "6/27/2017",
            "last": 16.516666,
            "rsi": 42.50646445
        },
        {
            "date": "6/28/2017",
            "last": 17.209999,
            "rsi": 50.13458399
        },
        {
            "date": "6/29/2017",
            "last": 16.333332,
            "rsi": 42.46297645
        },
        {
            "date": "6/30/2017",
            "last": 16.276667,
            "rsi": 42.01544572
        },
        {
            "date": "7/3/2017",
            "last": 15.833333,
            "rsi": 38.58876146
        },
        {
            "date": "7/5/2017",
            "last": 16.285,
            "rsi": 43.63264208
        },
        {
            "date": "7/6/2017",
            "last": 15.855,
            "rsi": 40.24380452
        },
        {
            "date": "7/7/2017",
            "last": 16.33,
            "rsi": 45.29800264
        },
        {
            "date": "7/10/2017",
            "last": 16.671667,
            "rsi": 48.66161278
        },
        {
            "date": "7/11/2017",
            "last": 16.808332,
            "rsi": 49.9863507
        },
        {
            "date": "7/12/2017",
            "last": 17.406668,
            "rsi": 55.41118177
        },
        {
            "date": "7/13/2017",
            "last": 17.521667,
            "rsi": 56.39025425
        },
        {
            "date": "7/14/2017",
            "last": 17.933332,
            "rsi": 59.79369076
        },
        {
            "date": "7/17/2017",
            "last": 17.943333,
            "rsi": 59.87561768
        },
        {
            "date": "7/18/2017",
            "last": 18.299999,
            "rsi": 62.78781349
        },
        {
            "date": "7/19/2017",
            "last": 18.635,
            "rsi": 65.33287954
        },
        {
            "date": "7/20/2017",
            "last": 18.705,
            "rsi": 65.85833414
        },
        {
            "date": "7/21/2017",
            "last": 18.676666,
            "rsi": 65.42605657
        },
        {
            "date": "7/24/2017",
            "last": 18.92,
            "rsi": 67.4047816
        },
        {
            "date": "7/25/2017",
            "last": 18.793333,
            "rsi": 65.30942584
        },
        {
            "date": "7/26/2017",
            "last": 18.961666,
            "rsi": 66.78705324
        },
        {
            "date": "7/27/2017",
            "last": 18.623333,
            "rsi": 61.14931601
        },
        {
            "date": "7/28/2017",
            "last": 18.563334,
            "rsi": 60.17915686
        },
        {
            "date": "7/31/2017",
            "last": 18.321667,
            "rsi": 56.30433923
        },
        {
            "date": "8/1/2017",
            "last": 18.441668,
            "rsi": 57.75877281
        },
        {
            "date": "8/2/2017",
            "last": 18.576668,
            "rsi": 59.39617771
        },
        {
            "date": "8/3/2017",
            "last": 18.383333,
            "rsi": 56.04557972
        },
        {
            "date": "8/4/2017",
            "last": 18.455,
            "rsi": 57.01360844
        },
        {
            "date": "8/7/2017",
            "last": 18.781668,
            "rsi": 61.20739812
        },
        {
            "date": "8/8/2017",
            "last": 18.711666,
            "rsi": 59.85968146
        },
        {
            "date": "8/9/2017",
            "last": 18.638332,
            "rsi": 58.40873272
        },
        {
            "date": "8/10/2017",
            "last": 17.428333,
            "rsi": 40.82508182
        },
        {
            "date": "8/11/2017",
            "last": 17.826668,
            "rsi": 46.53166402
        },
        {
            "date": "8/14/2017",
            "last": 18.52,
            "rsi": 54.71723229
        },
        {
            "date": "8/15/2017",
            "last": 18.553333,
            "rsi": 55.07333412
        },
        {
            "date": "8/16/2017",
            "last": 18.65,
            "rsi": 56.15028654
        },
        {
            "date": "8/17/2017",
            "last": 17.503332,
            "rsi": 42.98678504
        },
        {
            "date": "8/18/2017",
            "last": 17.441668,
            "rsi": 42.41097872
        },
        {
            "date": "8/21/2017",
            "last": 17.41,
            "rsi": 42.09909846
        },
        {
            "date": "8/22/2017",
            "last": 18.184999,
            "rsi": 51.49903931
        },
        {
            "date": "8/23/2017",
            "last": 17.981667,
            "rsi": 49.24038131
        },
        {
            "date": "8/24/2017",
            "last": 17.831667,
            "rsi": 47.58244327
        },
        {
            "date": "8/25/2017",
            "last": 17.711666,
            "rsi": 46.24105978
        },
        {
            "date": "8/28/2017",
            "last": 17.866667,
            "rsi": 48.26961236
        },
        {
            "date": "8/29/2017",
            "last": 18.086666,
            "rsi": 51.09058534
        },
        {
            "date": "8/30/2017",
            "last": 18.713333,
            "rsi": 58.09981012
        },
        {
            "date": "8/31/2017",
            "last": 19.245001,
            "rsi": 62.95094191
        },
        {
            "date": "9/1/2017",
            "last": 19.231667,
            "rsi": 62.75470622
        },
        {
            "date": "9/5/2017",
            "last": 18.716667,
            "rsi": 55.55183525
        },
        {
            "date": "9/6/2017",
            "last": 18.878332,
            "rsi": 57.21208682
        },
        {
            "date": "9/7/2017",
            "last": 18.995001,
            "rsi": 58.41917048
        },
        {
            "date": "9/8/2017",
            "last": 18.526667,
            "rsi": 52.06906502
        },
        {
            "date": "9/11/2017",
            "last": 19.116667,
            "rsi": 58.22906555
        },
        {
            "date": "9/12/2017",
            "last": 19.278334,
            "rsi": 59.75532148
        },
        {
            "date": "9/13/2017",
            "last": 19.358334,
            "rsi": 60.52399107
        },
        {
            "date": "9/14/2017",
            "last": 19.031668,
            "rsi": 55.83443238
        },
        {
            "date": "9/15/2017",
            "last": 19.184999,
            "rsi": 57.49904736
        },
        {
            "date": "9/18/2017",
            "last": 19.138332,
            "rsi": 56.79739339
        },
        {
            "date": "9/19/2017",
            "last": 19.219999,
            "rsi": 57.76861659
        },
        {
            "date": "9/20/2017",
            "last": 19.059999,
            "rsi": 55.15264223
        },
        {
            "date": "9/21/2017",
            "last": 18.693333,
            "rsi": 49.60851619
        },
        {
            "date": "9/22/2017",
            "last": 18.646667,
            "rsi": 48.93430675
        },
        {
            "date": "9/25/2017",
            "last": 18.061666,
            "rsi": 41.34794957
        },
        {
            "date": "9/26/2017",
            "last": 18.184999,
            "rsi": 43.34223207
        },
        {
            "date": "9/27/2017",
            "last": 18.678333,
            "rsi": 50.5806978
        },
        {
            "date": "9/28/2017",
            "last": 18.646667,
            "rsi": 50.13791558
        },
        {
            "date": "9/29/2017",
            "last": 19.041668,
            "rsi": 55.38454468
        },
        {
            "date": "10/2/2017",
            "last": 19.094999,
            "rsi": 56.0568512
        },
        {
            "date": "10/3/2017",
            "last": 19.215,
            "rsi": 57.60490974
        },
        {
            "date": "10/4/2017",
            "last": 19.264999,
            "rsi": 58.26463267
        },
        {
            "date": "10/5/2017",
            "last": 19.82,
            "rsi": 64.81061496
        },
        {
            "date": "10/6/2017",
            "last": 19.891666,
            "rsi": 65.56174614
        },
        {
            "date": "10/9/2017",
            "last": 19.841667,
            "rsi": 64.52689539
        },
        {
            "date": "10/10/2017",
            "last": 19.883333,
            "rsi": 65.02237153
        },
        {
            "date": "10/11/2017",
            "last": 20.056667,
            "rsi": 67.08224429
        },
        {
            "date": "10/12/2017",
            "last": 19.948334,
            "rsi": 64.52461753
        },
        {
            "date": "10/13/2017",
            "last": 20.171667,
            "rsi": 67.29312352
        },
        {
            "date": "10/16/2017",
            "last": 20.379999,
            "rsi": 69.67087281
        },
        {
            "date": "10/17/2017",
            "last": 20.451668,
            "rsi": 70.46630796
        },
        {
            "date": "10/18/2017",
            "last": 20.373333,
            "rsi": 68.35607139
        },
        {
            "date": "10/19/2017",
            "last": 20.148333,
            "rsi": 62.56092827
        },
        {
            "date": "10/20/2017",
            "last": 20.295,
            "rsi": 64.66393119
        },
        {
            "date": "10/23/2017",
            "last": 19.916668,
            "rsi": 55.93564798
        },
        {
            "date": "10/24/2017",
            "last": 20.018333,
            "rsi": 57.59216499
        },
        {
            "date": "10/25/2017",
            "last": 19.775,
            "rsi": 52.50449188
        },
        {
            "date": "10/26/2017",
            "last": 19.591667,
            "rsi": 48.9928304
        },
        {
            "date": "10/27/2017",
            "last": 21.280001,
            "rsi": 69.33399433
        },
        {
            "date": "10/30/2017",
            "last": 21.431667,
            "rsi": 70.47313275
        },
        {
            "date": "10/31/2017",
            "last": 21.658333,
            "rsi": 72.13884953
        },
        {
            "date": "11/1/2017",
            "last": 21.629999,
            "rsi": 71.59513182
        },
        {
            "date": "11/2/2017",
            "last": 21.52,
            "rsi": 69.40797869
        },
        {
            "date": "11/3/2017",
            "last": 22.120001,
            "rsi": 74.0624701
        },
        {
            "date": "11/6/2017",
            "last": 22.344999,
            "rsi": 75.56390737
        },
        {
            "date": "11/7/2017",
            "last": 22.381666,
            "rsi": 75.80966211
        },
        {
            "date": "11/8/2017",
            "last": 22.661667,
            "rsi": 77.65752726
        },
        {
            "date": "11/9/2017",
            "last": 22.298332,
            "rsi": 70.16729303
        },
        {
            "date": "11/10/2017",
            "last": 22.291668,
            "rsi": 70.03386951
        },
        {
            "date": "11/13/2017",
            "last": 22.358334,
            "rsi": 70.63542472
        },
        {
            "date": "11/14/2017",
            "last": 22.133333,
            "rsi": 65.83204512
        },
        {
            "date": "11/15/2017",
            "last": 21.808332,
            "rsi": 59.5344121
        },
        {
            "date": "11/16/2017",
            "last": 22.625,
            "rsi": 67.85568405
        },
        {
            "date": "11/17/2017",
            "last": 22.371668,
            "rsi": 63.49389153
        },
        {
            "date": "11/20/2017",
            "last": 22.316668,
            "rsi": 62.55375809
        },
        {
            "date": "11/21/2017",
            "last": 23.02,
            "rsi": 68.89616211
        },
        {
            "date": "11/22/2017",
            "last": 23.111668,
            "rsi": 69.6184294
        },
        {
            "date": "11/24/2017",
            "last": 23.371668,
            "rsi": 71.63064151
        },
        {
            "date": "11/27/2017",
            "last": 23.333332,
            "rsi": 70.8851598
        },
        {
            "date": "11/28/2017",
            "last": 23.504999,
            "rsi": 72.27655363
        },
        {
            "date": "11/29/2017",
            "last": 22.296667,
            "rsi": 53.0563763
        },
        {
            "date": "11/30/2017",
            "last": 22.85,
            "rsi": 58.49894666
        },
        {
            "date": "12/1/2017",
            "last": 22.545,
            "rsi": 54.7321847
        },
        {
            "date": "12/4/2017",
            "last": 21.766666,
            "rsi": 46.50307829
        },
        {
            "date": "12/5/2017",
            "last": 21.798332,
            "rsi": 46.85318387
        },
        {
            "date": "12/6/2017",
            "last": 22.086666,
            "rsi": 50.05814138
        },
        {
            "date": "12/7/2017",
            "last": 22.305,
            "rsi": 52.39898003
        },
        {
            "date": "12/8/2017",
            "last": 22.6,
            "rsi": 55.43815217
        },
        {
            "date": "12/11/2017",
            "last": 23.118334,
            "rsi": 60.24147394
        },
        {
            "date": "12/12/2017",
            "last": 23.031668,
            "rsi": 59.09451104
        },
        {
            "date": "12/13/2017",
            "last": 23.146667,
            "rsi": 60.17795714
        },
        {
            "date": "12/14/2017",
            "last": 23.113333,
            "rsi": 59.68448209
        },
        {
            "date": "12/15/2017",
            "last": 23.865,
            "rsi": 66.3795376
        },
        {
            "date": "12/18/2017",
            "last": 24.478333,
            "rsi": 70.6609195
        },
        {
            "date": "12/19/2017",
            "last": 24.08,
            "rsi": 64.88209153
        },
        {
            "date": "12/20/2017",
            "last": 23.98,
            "rsi": 63.47854807
        },
        {
            "date": "12/21/2017",
            "last": 23.968332,
            "rsi": 63.30646815
        },
        {
            "date": "12/22/2017",
            "last": 23.888332,
            "rsi": 62.06417956
        },
        {
            "date": "12/26/2017",
            "last": 23.501667,
            "rsi": 56.31233064
        },
        {
            "date": "12/27/2017",
            "last": 23.501667,
            "rsi": 56.31233064
        },
        {
            "date": "12/28/2017",
            "last": 23.565001,
            "rsi": 57.06814909
        },
        {
            "date": "12/29/2017",
            "last": 23.120001,
            "rsi": 50.46223572
        }
    ],
    '2018': [
        {
            "date": "2018-01-02T05:00:00.000Z",
            "last": 24.28,
            "rsi": 62.82
        },
        {
            "date": "2018-01-03T05:00:00.000Z",
            "last": 24.99,
            "rsi": 67.98
        },
        {
            "date": "2018-01-04T05:00:00.000Z",
            "last": 25.14,
            "rsi": 68.94
        },
        {
            "date": "2018-01-05T05:00:00.000Z",
            "last": 25.9,
            "rsi": 73.38
        },
        {
            "date": "2018-01-08T05:00:00.000Z",
            "last": 26.19,
            "rsi": 74.84
        },
        {
            "date": "2018-01-09T05:00:00.000Z",
            "last": 26.21,
            "rsi": 74.95
        },
        {
            "date": "2018-01-10T05:00:00.000Z",
            "last": 26.02,
            "rsi": 71.98
        },
        {
            "date": "2018-01-11T05:00:00.000Z",
            "last": 26.54,
            "rsi": 74.96
        },
        {
            "date": "2018-01-12T05:00:00.000Z",
            "last": 27.1,
            "rsi": 77.72
        },
        {
            "date": "2018-01-16T05:00:00.000Z",
            "last": 26.89,
            "rsi": 74.43
        },
        {
            "date": "2018-01-17T05:00:00.000Z",
            "last": 27.74,
            "rsi": 78.41
        },
        {
            "date": "2018-01-18T05:00:00.000Z",
            "last": 27.77,
            "rsi": 78.52
        },
        {
            "date": "2018-01-19T05:00:00.000Z",
            "last": 28.04,
            "rsi": 79.67
        },
        {
            "date": "2018-01-22T05:00:00.000Z",
            "last": 28.91,
            "rsi": 82.91
        },
        {
            "date": "2018-01-23T05:00:00.000Z",
            "last": 29.64,
            "rsi": 85.05
        },
        {
            "date": "2018-01-24T05:00:00.000Z",
            "last": 29.04,
            "rsi": 76.57
        },
        {
            "date": "2018-01-25T05:00:00.000Z",
            "last": 29.01,
            "rsi": 76.07
        },
        {
            "date": "2018-01-26T05:00:00.000Z",
            "last": 30.3,
            "rsi": 80.82
        },
        {
            "date": "2018-01-29T05:00:00.000Z",
            "last": 29.9,
            "rsi": 75.8
        },
        {
            "date": "2018-01-30T05:00:00.000Z",
            "last": 29.14,
            "rsi": 67.24
        },
        {
            "date": "2018-01-31T05:00:00.000Z",
            "last": 29.5,
            "rsi": 69.01
        },
        {
            "date": "2018-02-01T05:00:00.000Z",
            "last": 28.76,
            "rsi": 61.64
        },
        {
            "date": "2018-02-02T05:00:00.000Z",
            "last": 27,
            "rsi": 48.38
        },
        {
            "date": "2018-02-05T05:00:00.000Z",
            "last": 23.88,
            "rsi": 34.29
        },
        {
            "date": "2018-02-06T05:00:00.000Z",
            "last": 25.73,
            "rsi": 44.56
        },
        {
            "date": "2018-02-07T05:00:00.000Z",
            "last": 24.71,
            "rsi": 40.77
        },
        {
            "date": "2018-02-08T05:00:00.000Z",
            "last": 21.65,
            "rsi": 31.96
        },
        {
            "date": "2018-02-09T05:00:00.000Z",
            "last": 22.67,
            "rsi": 36.85
        },
        {
            "date": "2018-02-12T05:00:00.000Z",
            "last": 23.93,
            "rsi": 42.4
        },
        {
            "date": "2018-02-13T05:00:00.000Z",
            "last": 24.23,
            "rsi": 43.63
        },
        {
            "date": "2018-02-14T05:00:00.000Z",
            "last": 25.64,
            "rsi": 49.29
        },
        {
            "date": "2018-02-15T05:00:00.000Z",
            "last": 26.98,
            "rsi": 53.99
        },
        {
            "date": "2018-02-16T05:00:00.000Z",
            "last": 26.68,
            "rsi": 52.81
        },
        {
            "date": "2018-02-20T05:00:00.000Z",
            "last": 26.82,
            "rsi": 53.29
        },
        {
            "date": "2018-02-21T05:00:00.000Z",
            "last": 26.58,
            "rsi": 52.24
        },
        {
            "date": "2018-02-22T05:00:00.000Z",
            "last": 26.58,
            "rsi": 52.26
        },
        {
            "date": "2018-02-23T05:00:00.000Z",
            "last": 28.16,
            "rsi": 58.5
        },
        {
            "date": "2018-02-26T05:00:00.000Z",
            "last": 29.29,
            "rsi": 62.29
        },
        {
            "date": "2018-02-27T05:00:00.000Z",
            "last": 28.25,
            "rsi": 57.08
        },
        {
            "date": "2018-02-28T05:00:00.000Z",
            "last": 27.68,
            "rsi": 54.43
        },
        {
            "date": "2018-03-01T05:00:00.000Z",
            "last": 26.35,
            "rsi": 48.71
        },
        {
            "date": "2018-03-02T05:00:00.000Z",
            "last": 27.07,
            "rsi": 51.68
        },
        {
            "date": "2018-03-05T05:00:00.000Z",
            "last": 27.92,
            "rsi": 54.98
        },
        {
            "date": "2018-03-06T05:00:00.000Z",
            "last": 28.27,
            "rsi": 56.31
        },
        {
            "date": "2018-03-07T05:00:00.000Z",
            "last": 28.48,
            "rsi": 57.13
        },
        {
            "date": "2018-03-08T05:00:00.000Z",
            "last": 28.91,
            "rsi": 58.8
        },
        {
            "date": "2018-03-09T05:00:00.000Z",
            "last": 30.59,
            "rsi": 64.68
        },
        {
            "date": "2018-03-12T04:00:00.000Z",
            "last": 31.05,
            "rsi": 66.1
        },
        {
            "date": "2018-03-13T04:00:00.000Z",
            "last": 29.92,
            "rsi": 59.74
        },
        {
            "date": "2018-03-14T04:00:00.000Z",
            "last": 29.82,
            "rsi": 59.19
        },
        {
            "date": "2018-03-15T04:00:00.000Z",
            "last": 29.69,
            "rsi": 58.43
        },
        {
            "date": "2018-03-16T04:00:00.000Z",
            "last": 29.49,
            "rsi": 57.26
        },
        {
            "date": "2018-03-19T04:00:00.000Z",
            "last": 27.64,
            "rsi": 47.57
        },
        {
            "date": "2018-03-20T04:00:00.000Z",
            "last": 27.84,
            "rsi": 48.6
        },
        {
            "date": "2018-03-21T04:00:00.000Z",
            "last": 27.44,
            "rsi": 46.65
        },
        {
            "date": "2018-03-22T04:00:00.000Z",
            "last": 25.43,
            "rsi": 38.38
        },
        {
            "date": "2018-03-23T04:00:00.000Z",
            "last": 23.38,
            "rsi": 32.11
        },
        {
            "date": "2018-03-26T04:00:00.000Z",
            "last": 26.01,
            "rsi": 44.6
        },
        {
            "date": "2018-03-27T04:00:00.000Z",
            "last": 23.52,
            "rsi": 37.55
        },
        {
            "date": "2018-03-28T04:00:00.000Z",
            "last": 22.71,
            "rsi": 35.58
        },
        {
            "date": "2018-03-29T04:00:00.000Z",
            "last": 23.96,
            "rsi": 40.77
        },
        {
            "date": "2018-04-02T04:00:00.000Z",
            "last": 21.83,
            "rsi": 35.55
        },
        {
            "date": "2018-04-03T04:00:00.000Z",
            "last": 22.57,
            "rsi": 38.47
        },
        {
            "date": "2018-04-04T04:00:00.000Z",
            "last": 23.63,
            "rsi": 42.55
        },
        {
            "date": "2018-04-05T04:00:00.000Z",
            "last": 24.01,
            "rsi": 43.95
        },
        {
            "date": "2018-04-06T04:00:00.000Z",
            "last": 22.21,
            "rsi": 39.03
        },
        {
            "date": "2018-04-09T04:00:00.000Z",
            "last": 22.66,
            "rsi": 40.8
        },
        {
            "date": "2018-04-10T04:00:00.000Z",
            "last": 24.16,
            "rsi": 46.44
        },
        {
            "date": "2018-04-11T04:00:00.000Z",
            "last": 23.75,
            "rsi": 45.18
        },
        {
            "date": "2018-04-12T04:00:00.000Z",
            "last": 24.58,
            "rsi": 48.27
        },
        {
            "date": "2018-04-13T04:00:00.000Z",
            "last": 24.22,
            "rsi": 47.02
        },
        {
            "date": "2018-04-16T04:00:00.000Z",
            "last": 24.75,
            "rsi": 49.11
        },
        {
            "date": "2018-04-17T04:00:00.000Z",
            "last": 26.34,
            "rsi": 54.78
        },
        {
            "date": "2018-04-18T04:00:00.000Z",
            "last": 26.52,
            "rsi": 55.4
        },
        {
            "date": "2018-04-19T04:00:00.000Z",
            "last": 25.8,
            "rsi": 52.36
        },
        {
            "date": "2018-04-20T04:00:00.000Z",
            "last": 24.56,
            "rsi": 47.54
        },
        {
            "date": "2018-04-23T04:00:00.000Z",
            "last": 24.37,
            "rsi": 46.81
        },
        {
            "date": "2018-04-24T04:00:00.000Z",
            "last": 22.81,
            "rsi": 41.35
        },
        {
            "date": "2018-04-25T04:00:00.000Z",
            "last": 22.9,
            "rsi": 41.78
        },
        {
            "date": "2018-04-26T04:00:00.000Z",
            "last": 24.32,
            "rsi": 48.14
        },
        {
            "date": "2018-04-27T04:00:00.000Z",
            "last": 24.38,
            "rsi": 48.39
        },
        {
            "date": "2018-04-30T04:00:00.000Z",
            "last": 23.86,
            "rsi": 46.25
        },
        {
            "date": "2018-05-01T04:00:00.000Z",
            "last": 24.64,
            "rsi": 49.81
        },
        {
            "date": "2018-05-02T04:00:00.000Z",
            "last": 24.21,
            "rsi": 47.92
        },
        {
            "date": "2018-05-03T04:00:00.000Z",
            "last": 24.21,
            "rsi": 47.93
        },
        {
            "date": "2018-05-04T04:00:00.000Z",
            "last": 25.57,
            "rsi": 54.31
        },
        {
            "date": "2018-05-07T04:00:00.000Z",
            "last": 26.18,
            "rsi": 56.86
        },
        {
            "date": "2018-05-08T04:00:00.000Z",
            "last": 26.09,
            "rsi": 56.38
        },
        {
            "date": "2018-05-09T04:00:00.000Z",
            "last": 26.97,
            "rsi": 60.05
        },
        {
            "date": "2018-05-10T04:00:00.000Z",
            "last": 27.81,
            "rsi": 63.25
        },
        {
            "date": "2018-05-11T04:00:00.000Z",
            "last": 27.72,
            "rsi": 62.72
        },
        {
            "date": "2018-05-14T04:00:00.000Z",
            "last": 27.85,
            "rsi": 63.21
        },
        {
            "date": "2018-05-15T04:00:00.000Z",
            "last": 26.94,
            "rsi": 57.2
        },
        {
            "date": "2018-05-16T04:00:00.000Z",
            "last": 27.44,
            "rsi": 59.49
        },
        {
            "date": "2018-05-17T04:00:00.000Z",
            "last": 27.13,
            "rsi": 57.43
        },
        {
            "date": "2018-05-18T04:00:00.000Z",
            "last": 26.7,
            "rsi": 54.57
        },
        {
            "date": "2018-05-21T04:00:00.000Z",
            "last": 27.16,
            "rsi": 57.04
        },
        {
            "date": "2018-05-22T04:00:00.000Z",
            "last": 27.02,
            "rsi": 56.04
        },
        {
            "date": "2018-05-23T04:00:00.000Z",
            "last": 27.7,
            "rsi": 59.68
        },
        {
            "date": "2018-05-24T04:00:00.000Z",
            "last": 27.7,
            "rsi": 59.71
        },
        {
            "date": "2018-05-25T04:00:00.000Z",
            "last": 27.77,
            "rsi": 60.1
        },
        {
            "date": "2018-05-29T04:00:00.000Z",
            "last": 27.42,
            "rsi": 57.05
        },
        {
            "date": "2018-05-30T04:00:00.000Z",
            "last": 28,
            "rsi": 60.6
        },
        {
            "date": "2018-05-31T04:00:00.000Z",
            "last": 27.94,
            "rsi": 60.05
        },
        {
            "date": "2018-06-01T04:00:00.000Z",
            "last": 29.25,
            "rsi": 67.01
        },
        {
            "date": "2018-06-04T04:00:00.000Z",
            "last": 30,
            "rsi": 70.24
        },
        {
            "date": "2018-06-05T04:00:00.000Z",
            "last": 30.31,
            "rsi": 71.48
        },
        {
            "date": "2018-06-06T04:00:00.000Z",
            "last": 30.81,
            "rsi": 73.4
        },
        {
            "date": "2018-06-07T04:00:00.000Z",
            "last": 30.09,
            "rsi": 66.49
        },
        {
            "date": "2018-06-08T04:00:00.000Z",
            "last": 30.07,
            "rsi": 66.3
        },
        {
            "date": "2018-06-11T04:00:00.000Z",
            "last": 30.31,
            "rsi": 67.47
        },
        {
            "date": "2018-06-12T04:00:00.000Z",
            "last": 30.78,
            "rsi": 69.77
        },
        {
            "date": "2018-06-13T04:00:00.000Z",
            "last": 30.75,
            "rsi": 69.38
        },
        {
            "date": "2018-06-14T04:00:00.000Z",
            "last": 31.68,
            "rsi": 73.57
        },
        {
            "date": "2018-06-15T04:00:00.000Z",
            "last": 31.37,
            "rsi": 70.09
        },
        {
            "date": "2018-06-18T04:00:00.000Z",
            "last": 31.3,
            "rsi": 69.31
        },
        {
            "date": "2018-06-19T04:00:00.000Z",
            "last": 31.02,
            "rsi": 66.12
        },
        {
            "date": "2018-06-20T04:00:00.000Z",
            "last": 31.67,
            "rsi": 69.61
        },
        {
            "date": "2018-06-21T04:00:00.000Z",
            "last": 30.85,
            "rsi": 61.05
        },
        {
            "date": "2018-06-22T04:00:00.000Z",
            "last": 30.54,
            "rsi": 58.14
        },
        {
            "date": "2018-06-25T04:00:00.000Z",
            "last": 28.59,
            "rsi": 43.95
        },
        {
            "date": "2018-06-26T04:00:00.000Z",
            "last": 28.91,
            "rsi": 46.23
        },
        {
            "date": "2018-06-27T04:00:00.000Z",
            "last": 27.75,
            "rsi": 39.8
        },
        {
            "date": "2018-06-28T04:00:00.000Z",
            "last": 28.42,
            "rsi": 44.66
        },
        {
            "date": "2018-06-29T04:00:00.000Z",
            "last": 28.56,
            "rsi": 45.56
        },
        {
            "date": "2018-07-02T04:00:00.000Z",
            "last": 29.19,
            "rsi": 49.91
        },
        {
            "date": "2018-07-03T04:00:00.000Z",
            "last": 28.19,
            "rsi": 43.97
        },
        {
            "date": "2018-07-05T04:00:00.000Z",
            "last": 29.23,
            "rsi": 50.5
        },
        {
            "date": "2018-07-06T04:00:00.000Z",
            "last": 30.54,
            "rsi": 57.3
        },
        {
            "date": "2018-07-09T04:00:00.000Z",
            "last": 31.39,
            "rsi": 61.03
        },
        {
            "date": "2018-07-10T04:00:00.000Z",
            "last": 31.47,
            "rsi": 61.35
        },
        {
            "date": "2018-07-11T04:00:00.000Z",
            "last": 31,
            "rsi": 58.19
        },
        {
            "date": "2018-07-12T04:00:00.000Z",
            "last": 32.53,
            "rsi": 64.71
        },
        {
            "date": "2018-07-13T04:00:00.000Z",
            "last": 32.63,
            "rsi": 65.07
        },
        {
            "date": "2018-07-16T04:00:00.000Z",
            "last": 32.41,
            "rsi": 63.44
        },
        {
            "date": "2018-07-17T04:00:00.000Z",
            "last": 33.01,
            "rsi": 65.95
        },
        {
            "date": "2018-07-18T04:00:00.000Z",
            "last": 32.8,
            "rsi": 64.28
        },
        {
            "date": "2018-07-19T04:00:00.000Z",
            "last": 32.31,
            "rsi": 60.49
        },
        {
            "date": "2018-07-20T04:00:00.000Z",
            "last": 32.27,
            "rsi": 60.14
        },
        {
            "date": "2018-07-23T04:00:00.000Z",
            "last": 32.55,
            "rsi": 61.64
        },
        {
            "date": "2018-07-24T04:00:00.000Z",
            "last": 32.97,
            "rsi": 63.83
        },
        {
            "date": "2018-07-25T04:00:00.000Z",
            "last": 34.34,
            "rsi": 69.93
        },
        {
            "date": "2018-07-26T04:00:00.000Z",
            "last": 32.84,
            "rsi": 58.36
        },
        {
            "date": "2018-07-27T04:00:00.000Z",
            "last": 31.47,
            "rsi": 50.19
        },
        {
            "date": "2018-07-30T04:00:00.000Z",
            "last": 30.11,
            "rsi": 43.68
        },
        {
            "date": "2018-07-31T04:00:00.000Z",
            "last": 30.72,
            "rsi": 46.96
        },
        {
            "date": "2018-08-01T04:00:00.000Z",
            "last": 31.14,
            "rsi": 49.19
        },
        {
            "date": "2018-08-02T04:00:00.000Z",
            "last": 32.38,
            "rsi": 55.19
        },
        {
            "date": "2018-08-03T04:00:00.000Z",
            "last": 32.67,
            "rsi": 56.48
        },
        {
            "date": "2018-08-06T04:00:00.000Z",
            "last": 33.26,
            "rsi": 59.11
        },
        {
            "date": "2018-08-07T04:00:00.000Z",
            "last": 33.59,
            "rsi": 60.5
        },
        {
            "date": "2018-08-08T04:00:00.000Z",
            "last": 33.68,
            "rsi": 60.9
        },
        {
            "date": "2018-08-09T04:00:00.000Z",
            "last": 33.65,
            "rsi": 60.68
        },
        {
            "date": "2018-08-10T04:00:00.000Z",
            "last": 32.87,
            "rsi": 55.1
        },
        {
            "date": "2018-08-13T04:00:00.000Z",
            "last": 32.77,
            "rsi": 54.45
        },
        {
            "date": "2018-08-14T04:00:00.000Z",
            "last": 33.38,
            "rsi": 57.87
        },
        {
            "date": "2018-08-15T04:00:00.000Z",
            "last": 32.16,
            "rsi": 49.78
        },
        {
            "date": "2018-08-16T04:00:00.000Z",
            "last": 32.46,
            "rsi": 51.55
        },
        {
            "date": "2018-08-17T04:00:00.000Z",
            "last": 32.45,
            "rsi": 51.52
        },
        {
            "date": "2018-08-20T04:00:00.000Z",
            "last": 32.38,
            "rsi": 51.06
        },
        {
            "date": "2018-08-21T04:00:00.000Z",
            "last": 32.72,
            "rsi": 53.37
        },
        {
            "date": "2018-08-22T04:00:00.000Z",
            "last": 33.1,
            "rsi": 55.91
        },
        {
            "date": "2018-08-23T04:00:00.000Z",
            "last": 32.94,
            "rsi": 54.52
        },
        {
            "date": "2018-08-24T04:00:00.000Z",
            "last": 33.85,
            "rsi": 60.4
        },
        {
            "date": "2018-08-27T04:00:00.000Z",
            "last": 34.87,
            "rsi": 65.72
        },
        {
            "date": "2018-08-28T04:00:00.000Z",
            "last": 35.03,
            "rsi": 66.46
        },
        {
            "date": "2018-08-29T04:00:00.000Z",
            "last": 36.25,
            "rsi": 71.65
        },
        {
            "date": "2018-08-30T04:00:00.000Z",
            "last": 36.04,
            "rsi": 69.7
        },
        {
            "date": "2018-08-31T04:00:00.000Z",
            "last": 36.15,
            "rsi": 70.15
        },
        {
            "date": "2018-09-04T04:00:00.000Z",
            "last": 35.72,
            "rsi": 65.87
        },
        {
            "date": "2018-09-05T04:00:00.000Z",
            "last": 34.3,
            "rsi": 54.12
        },
        {
            "date": "2018-09-06T04:00:00.000Z",
            "last": 33.37,
            "rsi": 48.04
        },
        {
            "date": "2018-09-07T04:00:00.000Z",
            "last": 33.03,
            "rsi": 46.07
        },
        {
            "date": "2018-09-10T04:00:00.000Z",
            "last": 33.33,
            "rsi": 48.08
        },
        {
            "date": "2018-09-11T04:00:00.000Z",
            "last": 34.06,
            "rsi": 52.91
        },
        {
            "date": "2018-09-12T04:00:00.000Z",
            "last": 33.77,
            "rsi": 50.88
        },
        {
            "date": "2018-09-13T04:00:00.000Z",
            "last": 34.77,
            "rsi": 56.92
        },
        {
            "date": "2018-09-14T04:00:00.000Z",
            "last": 34.51,
            "rsi": 54.99
        },
        {
            "date": "2018-09-17T04:00:00.000Z",
            "last": 33.05,
            "rsi": 45.81
        },
        {
            "date": "2018-09-18T04:00:00.000Z",
            "last": 33.83,
            "rsi": 50.6
        },
        {
            "date": "2018-09-19T04:00:00.000Z",
            "last": 33.76,
            "rsi": 50.14
        },
        {
            "date": "2018-09-20T04:00:00.000Z",
            "last": 34.82,
            "rsi": 56.16
        },
        {
            "date": "2018-09-21T04:00:00.000Z",
            "last": 34.26,
            "rsi": 52.58
        },
        {
            "date": "2018-09-24T04:00:00.000Z",
            "last": 34.56,
            "rsi": 54.25
        },
        {
            "date": "2018-09-25T04:00:00.000Z",
            "last": 34.7,
            "rsi": 55.06
        },
        {
            "date": "2018-09-26T04:00:00.000Z",
            "last": 34.67,
            "rsi": 54.8
        },
        {
            "date": "2018-09-27T04:00:00.000Z",
            "last": 35.62,
            "rsi": 60.34
        },
        {
            "date": "2018-09-28T04:00:00.000Z",
            "last": 35.57,
            "rsi": 59.89
        },
        {
            "date": "2018-10-01T04:00:00.000Z",
            "last": 35.78,
            "rsi": 61.06
        },
        {
            "date": "2018-10-02T04:00:00.000Z",
            "last": 35.57,
            "rsi": 59.2
        },
        {
            "date": "2018-10-03T04:00:00.000Z",
            "last": 35.67,
            "rsi": 59.87
        },
        {
            "date": "2018-10-04T04:00:00.000Z",
            "last": 33.64,
            "rsi": 44.48
        },
        {
            "date": "2018-10-05T04:00:00.000Z",
            "last": 32.38,
            "rsi": 37.95
        },
        {
            "date": "2018-10-08T04:00:00.000Z",
            "last": 31.8,
            "rsi": 35.39
        },
        {
            "date": "2018-10-09T04:00:00.000Z",
            "last": 32.04,
            "rsi": 37.32
        },
        {
            "date": "2018-10-10T04:00:00.000Z",
            "last": 27.89,
            "rsi": 24.16
        },
        {
            "date": "2018-10-11T04:00:00.000Z",
            "last": 26.75,
            "rsi": 21.9
        },
        {
            "date": "2018-10-12T04:00:00.000Z",
            "last": 29.01,
            "rsi": 35
        },
        {
            "date": "2018-10-15T04:00:00.000Z",
            "last": 27.92,
            "rsi": 32.18
        },
        {
            "date": "2018-10-16T04:00:00.000Z",
            "last": 30.33,
            "rsi": 43.03
        },
        {
            "date": "2018-10-17T04:00:00.000Z",
            "last": 30.42,
            "rsi": 43.44
        },
        {
            "date": "2018-10-18T04:00:00.000Z",
            "last": 28.32,
            "rsi": 37.39
        },
        {
            "date": "2018-10-19T04:00:00.000Z",
            "last": 28.2,
            "rsi": 37.09
        },
        {
            "date": "2018-10-22T04:00:00.000Z",
            "last": 28.62,
            "rsi": 39.06
        },
        {
            "date": "2018-10-23T04:00:00.000Z",
            "last": 28.31,
            "rsi": 38.11
        },
        {
            "date": "2018-10-24T04:00:00.000Z",
            "last": 24.46,
            "rsi": 28.87
        },
        {
            "date": "2018-10-25T04:00:00.000Z",
            "last": 26.97,
            "rsi": 39.21
        },
        {
            "date": "2018-10-26T04:00:00.000Z",
            "last": 24.88,
            "rsi": 34.68
        },
        {
            "date": "2018-10-29T04:00:00.000Z",
            "last": 23.55,
            "rsi": 32.14
        },
        {
            "date": "2018-10-30T04:00:00.000Z",
            "last": 24.45,
            "rsi": 35.61
        },
        {
            "date": "2018-10-31T04:00:00.000Z",
            "last": 26.1,
            "rsi": 41.47
        },
        {
            "date": "2018-11-01T04:00:00.000Z",
            "last": 27.25,
            "rsi": 45.18
        },
        {
            "date": "2018-11-02T04:00:00.000Z",
            "last": 26.02,
            "rsi": 42.1
        },
        {
            "date": "2018-11-05T05:00:00.000Z",
            "last": 25.77,
            "rsi": 41.47
        },
        {
            "date": "2018-11-06T05:00:00.000Z",
            "last": 26.32,
            "rsi": 43.43
        },
        {
            "date": "2018-11-07T05:00:00.000Z",
            "last": 28.74,
            "rsi": 51.26
        },
        {
            "date": "2018-11-08T05:00:00.000Z",
            "last": 28.25,
            "rsi": 49.76
        },
        {
            "date": "2018-11-09T05:00:00.000Z",
            "last": 26.81,
            "rsi": 45.55
        },
        {
            "date": "2018-11-12T05:00:00.000Z",
            "last": 24.45,
            "rsi": 39.63
        },
        {
            "date": "2018-11-13T05:00:00.000Z",
            "last": 24.44,
            "rsi": 39.61
        },
        {
            "date": "2018-11-14T05:00:00.000Z",
            "last": 23.83,
            "rsi": 38.1
        },
        {
            "date": "2018-11-15T05:00:00.000Z",
            "last": 25.1,
            "rsi": 42.92
        },
        {
            "date": "2018-11-16T05:00:00.000Z",
            "last": 24.83,
            "rsi": 42.16
        },
        {
            "date": "2018-11-19T05:00:00.000Z",
            "last": 22.44,
            "rsi": 36.16
        },
        {
            "date": "2018-11-20T05:00:00.000Z",
            "last": 21.2,
            "rsi": 33.48
        },
        {
            "date": "2018-11-21T05:00:00.000Z",
            "last": 21.67,
            "rsi": 35.45
        },
        {
            "date": "2018-11-23T05:00:00.000Z",
            "last": 21.19,
            "rsi": 34.34
        },
        {
            "date": "2018-11-26T05:00:00.000Z",
            "last": 22.65,
            "rsi": 40.41
        },
        {
            "date": "2018-11-27T05:00:00.000Z",
            "last": 22.89,
            "rsi": 41.35
        },
        {
            "date": "2018-11-28T05:00:00.000Z",
            "last": 25.06,
            "rsi": 49.32
        },
        {
            "date": "2018-11-29T05:00:00.000Z",
            "last": 24.83,
            "rsi": 48.56
        },
        {
            "date": "2018-11-30T05:00:00.000Z",
            "last": 25.34,
            "rsi": 50.41
        },
        {
            "date": "2018-12-03T05:00:00.000Z",
            "last": 26.65,
            "rsi": 54.77
        },
        {
            "date": "2018-12-04T05:00:00.000Z",
            "last": 23.72,
            "rsi": 45.13
        },
        {
            "date": "2018-12-06T05:00:00.000Z",
            "last": 24.06,
            "rsi": 46.33
        },
        {
            "date": "2018-12-07T05:00:00.000Z",
            "last": 21.7,
            "rsi": 39.92
        },
        {
            "date": "2018-12-10T05:00:00.000Z",
            "last": 22.39,
            "rsi": 42.4
        },
        {
            "date": "2018-12-11T05:00:00.000Z",
            "last": 22.62,
            "rsi": 43.29
        },
        {
            "date": "2018-12-12T05:00:00.000Z",
            "last": 23.19,
            "rsi": 45.44
        },
        {
            "date": "2018-12-13T05:00:00.000Z",
            "last": 23.2,
            "rsi": 45.46
        },
        {
            "date": "2018-12-14T05:00:00.000Z",
            "last": 21.45,
            "rsi": 40.05
        },
        {
            "date": "2018-12-17T05:00:00.000Z",
            "last": 20.07,
            "rsi": 36.36
        },
        {
            "date": "2018-12-18T05:00:00.000Z",
            "last": 20.4,
            "rsi": 37.85
        },
        {
            "date": "2018-12-19T05:00:00.000Z",
            "last": 18.92,
            "rsi": 34.07
        },
        {
            "date": "2018-12-20T05:00:00.000Z",
            "last": 18.17,
            "rsi": 32.27
        },
        {
            "date": "2018-12-21T05:00:00.000Z",
            "last": 16.41,
            "rsi": 28.54
        },
        {
            "date": "2018-12-24T05:00:00.000Z",
            "last": 15.19,
            "rsi": 26.28
        },
        {
            "date": "2018-12-26T05:00:00.000Z",
            "last": 17.93,
            "rsi": 38.17
        },
        {
            "date": "2018-12-27T05:00:00.000Z",
            "last": 18.18,
            "rsi": 39.16
        },
        {
            "date": "2018-12-28T05:00:00.000Z",
            "last": 18.11,
            "rsi": 38.96
        }
    ],
    '2019': [
        {
            "date": "2019-01-03T05:00:00.000Z",
            "last": 16.97,
            "rsi": 36.57
        },
        {
            "date": "2019-01-04T05:00:00.000Z",
            "last": 19.14,
            "rsi": 45.44
        },
        {
            "date": "2019-01-07T05:00:00.000Z",
            "last": 19.75,
            "rsi": 47.66
        },
        {
            "date": "2019-01-08T05:00:00.000Z",
            "last": 20.32,
            "rsi": 49.72
        },
        {
            "date": "2019-01-09T05:00:00.000Z",
            "last": 20.8,
            "rsi": 51.45
        },
        {
            "date": "2019-01-10T05:00:00.000Z",
            "last": 21,
            "rsi": 52.18
        },
        {
            "date": "2019-01-11T05:00:00.000Z",
            "last": 20.75,
            "rsi": 51.14
        },
        {
            "date": "2019-01-14T05:00:00.000Z",
            "last": 20.2,
            "rsi": 48.86
        },
        {
            "date": "2019-01-15T05:00:00.000Z",
            "last": 21.33,
            "rsi": 53.49
        },
        {
            "date": "2019-01-16T05:00:00.000Z",
            "last": 21.35,
            "rsi": 53.61
        },
        {
            "date": "2019-01-17T05:00:00.000Z",
            "last": 21.85,
            "rsi": 55.68
        },
        {
            "date": "2019-01-18T05:00:00.000Z",
            "last": 22.45,
            "rsi": 58.1
        },
        {
            "date": "2019-01-22T05:00:00.000Z",
            "last": 21.22,
            "rsi": 51.81
        },
        {
            "date": "2019-01-23T05:00:00.000Z",
            "last": 21.24,
            "rsi": 51.9
        },
        {
            "date": "2019-01-24T05:00:00.000Z",
            "last": 21.61,
            "rsi": 53.65
        },
        {
            "date": "2019-01-25T05:00:00.000Z",
            "last": 22.38,
            "rsi": 57.12
        },
        {
            "date": "2019-01-28T05:00:00.000Z",
            "last": 21.56,
            "rsi": 52.58
        },
        {
            "date": "2019-01-29T05:00:00.000Z",
            "last": 20.94,
            "rsi": 49.46
        },
        {
            "date": "2019-01-30T05:00:00.000Z",
            "last": 22.51,
            "rsi": 56.61
        },
        {
            "date": "2019-01-31T05:00:00.000Z",
            "last": 23.5,
            "rsi": 60.41
        },
        {
            "date": "2019-02-01T05:00:00.000Z",
            "last": 23.2,
            "rsi": 58.73
        },
        {
            "date": "2019-02-04T05:00:00.000Z",
            "last": 24.06,
            "rsi": 61.96
        },
        {
            "date": "2019-02-05T05:00:00.000Z",
            "last": 24.69,
            "rsi": 64.21
        },
        {
            "date": "2019-02-06T05:00:00.000Z",
            "last": 24.5,
            "rsi": 62.98
        },
        {
            "date": "2019-02-07T05:00:00.000Z",
            "last": 23.5,
            "rsi": 56.94
        },
        {
            "date": "2019-02-08T05:00:00.000Z",
            "last": 23.61,
            "rsi": 57.47
        },
        {
            "date": "2019-02-11T05:00:00.000Z",
            "last": 23.56,
            "rsi": 57.12
        },
        {
            "date": "2019-02-12T05:00:00.000Z",
            "last": 24.58,
            "rsi": 61.71
        },
        {
            "date": "2019-02-13T05:00:00.000Z",
            "last": 24.63,
            "rsi": 61.93
        },
        {
            "date": "2019-02-14T05:00:00.000Z",
            "last": 24.72,
            "rsi": 62.34
        },
        {
            "date": "2019-02-15T05:00:00.000Z",
            "last": 25.01,
            "rsi": 63.72
        },
        {
            "date": "2019-02-19T05:00:00.000Z",
            "last": 25.17,
            "rsi": 64.43
        },
        {
            "date": "2019-02-20T05:00:00.000Z",
            "last": 25.15,
            "rsi": 64.25
        },
        {
            "date": "2019-02-21T05:00:00.000Z",
            "last": 24.86,
            "rsi": 61.59
        },
        {
            "date": "2019-02-22T05:00:00.000Z",
            "last": 25.4,
            "rsi": 64.58
        },
        {
            "date": "2019-02-25T05:00:00.000Z",
            "last": 25.68,
            "rsi": 66.06
        },
        {
            "date": "2019-02-26T05:00:00.000Z",
            "last": 25.76,
            "rsi": 66.49
        },
        {
            "date": "2019-02-27T05:00:00.000Z",
            "last": 25.68,
            "rsi": 65.6
        },
        {
            "date": "2019-02-28T05:00:00.000Z",
            "last": 25.52,
            "rsi": 63.75
        },
        {
            "date": "2019-03-01T05:00:00.000Z",
            "last": 26.03,
            "rsi": 66.95
        },
        {
            "date": "2019-03-04T05:00:00.000Z",
            "last": 26.03,
            "rsi": 66.98
        },
        {
            "date": "2019-03-05T05:00:00.000Z",
            "last": 26.1,
            "rsi": 67.4
        },
        {
            "date": "2019-03-06T05:00:00.000Z",
            "last": 25.65,
            "rsi": 61.5
        },
        {
            "date": "2019-03-07T05:00:00.000Z",
            "last": 24.72,
            "rsi": 51.43
        },
        {
            "date": "2019-03-08T05:00:00.000Z",
            "last": 24.58,
            "rsi": 50.11
        },
        {
            "date": "2019-03-11T04:00:00.000Z",
            "last": 26.11,
            "rsi": 61.73
        },
        {
            "date": "2019-03-12T04:00:00.000Z",
            "last": 26.53,
            "rsi": 64.22
        },
        {
            "date": "2019-03-13T04:00:00.000Z",
            "last": 27.11,
            "rsi": 67.31
        },
        {
            "date": "2019-03-14T04:00:00.000Z",
            "last": 26.99,
            "rsi": 66.03
        },
        {
            "date": "2019-03-15T04:00:00.000Z",
            "last": 27.66,
            "rsi": 69.52
        },
        {
            "date": "2019-03-18T04:00:00.000Z",
            "last": 27.91,
            "rsi": 70.73
        },
        {
            "date": "2019-03-19T04:00:00.000Z",
            "last": 28.19,
            "rsi": 72.07
        },
        {
            "date": "2019-03-20T04:00:00.000Z",
            "last": 28.5,
            "rsi": 73.53
        },
        {
            "date": "2019-03-21T04:00:00.000Z",
            "last": 29.83,
            "rsi": 78.6
        },
        {
            "date": "2019-03-22T04:00:00.000Z",
            "last": 27.88,
            "rsi": 60.25
        },
        {
            "date": "2019-03-25T04:00:00.000Z",
            "last": 27.7,
            "rsi": 58.93
        },
        {
            "date": "2019-03-26T04:00:00.000Z",
            "last": 28.08,
            "rsi": 60.94
        },
        {
            "date": "2019-03-27T04:00:00.000Z",
            "last": 27.53,
            "rsi": 56.61
        },
        {
            "date": "2019-03-28T04:00:00.000Z",
            "last": 27.7,
            "rsi": 57.64
        },
        {
            "date": "2019-03-29T04:00:00.000Z",
            "last": 28.33,
            "rsi": 61.19
        },
        {
            "date": "2019-04-01T04:00:00.000Z",
            "last": 29.44,
            "rsi": 66.57
        },
        {
            "date": "2019-04-02T04:00:00.000Z",
            "last": 29.77,
            "rsi": 67.96
        },
        {
            "date": "2019-04-03T04:00:00.000Z",
            "last": 30.28,
            "rsi": 70.09
        },
        {
            "date": "2019-04-04T04:00:00.000Z",
            "last": 30.24,
            "rsi": 69.65
        },
        {
            "date": "2019-04-05T04:00:00.000Z",
            "last": 30.69,
            "rsi": 71.58
        },
        {
            "date": "2019-04-08T04:00:00.000Z",
            "last": 30.93,
            "rsi": 72.56
        },
        {
            "date": "2019-04-09T04:00:00.000Z",
            "last": 30.59,
            "rsi": 68.91
        },
        {
            "date": "2019-04-10T04:00:00.000Z",
            "last": 31.09,
            "rsi": 71.18
        },
        {
            "date": "2019-04-11T04:00:00.000Z",
            "last": 30.85,
            "rsi": 68.62
        },
        {
            "date": "2019-04-12T04:00:00.000Z",
            "last": 31.24,
            "rsi": 70.47
        },
        {
            "date": "2019-04-15T04:00:00.000Z",
            "last": 31.26,
            "rsi": 70.6
        },
        {
            "date": "2019-04-16T04:00:00.000Z",
            "last": 31.57,
            "rsi": 72.12
        },
        {
            "date": "2019-04-17T04:00:00.000Z",
            "last": 31.88,
            "rsi": 73.64
        },
        {
            "date": "2019-04-18T04:00:00.000Z",
            "last": 31.98,
            "rsi": 74.13
        },
        {
            "date": "2019-04-22T04:00:00.000Z",
            "last": 32.25,
            "rsi": 75.43
        },
        {
            "date": "2019-04-23T04:00:00.000Z",
            "last": 33.47,
            "rsi": 80.3
        },
        {
            "date": "2019-04-24T04:00:00.000Z",
            "last": 33.15,
            "rsi": 76
        },
        {
            "date": "2019-04-25T04:00:00.000Z",
            "last": 33.52,
            "rsi": 77.48
        },
        {
            "date": "2019-04-26T04:00:00.000Z",
            "last": 33.64,
            "rsi": 77.95
        },
        {
            "date": "2019-04-29T04:00:00.000Z",
            "last": 33.82,
            "rsi": 78.68
        },
        {
            "date": "2019-04-30T04:00:00.000Z",
            "last": 33.04,
            "rsi": 68.26
        },
        {
            "date": "2019-05-01T04:00:00.000Z",
            "last": 32.67,
            "rsi": 63.8
        },
        {
            "date": "2019-05-02T04:00:00.000Z",
            "last": 32.26,
            "rsi": 59.4
        },
        {
            "date": "2019-05-03T04:00:00.000Z",
            "last": 33.78,
            "rsi": 68.34
        },
        {
            "date": "2019-05-06T04:00:00.000Z",
            "last": 33.18,
            "rsi": 62.44
        },
        {
            "date": "2019-05-07T04:00:00.000Z",
            "last": 31.25,
            "rsi": 48.17
        },
        {
            "date": "2019-05-08T04:00:00.000Z",
            "last": 30.98,
            "rsi": 46.54
        },
        {
            "date": "2019-05-09T04:00:00.000Z",
            "last": 30.49,
            "rsi": 43.7
        },
        {
            "date": "2019-05-10T04:00:00.000Z",
            "last": 30.57,
            "rsi": 44.33
        },
        {
            "date": "2019-05-13T04:00:00.000Z",
            "last": 27.41,
            "rsi": 30.55
        },
        {
            "date": "2019-05-14T04:00:00.000Z",
            "last": 28.27,
            "rsi": 36.35
        },
        {
            "date": "2019-05-15T04:00:00.000Z",
            "last": 29.44,
            "rsi": 43.32
        },
        {
            "date": "2019-05-16T04:00:00.000Z",
            "last": 30.36,
            "rsi": 48.11
        },
        {
            "date": "2019-05-17T04:00:00.000Z",
            "last": 29.42,
            "rsi": 43.99
        },
        {
            "date": "2019-05-20T04:00:00.000Z",
            "last": 27.94,
            "rsi": 38.47
        },
        {
            "date": "2019-05-21T04:00:00.000Z",
            "last": 28.78,
            "rsi": 42.87
        },
        {
            "date": "2019-05-22T04:00:00.000Z",
            "last": 28.41,
            "rsi": 41.44
        },
        {
            "date": "2019-05-23T04:00:00.000Z",
            "last": 27.07,
            "rsi": 36.74
        },
        {
            "date": "2019-05-24T04:00:00.000Z",
            "last": 27.03,
            "rsi": 36.61
        },
        {
            "date": "2019-05-28T04:00:00.000Z",
            "last": 26.74,
            "rsi": 35.6
        },
        {
            "date": "2019-05-29T04:00:00.000Z",
            "last": 26.07,
            "rsi": 33.31
        },
        {
            "date": "2019-05-30T04:00:00.000Z",
            "last": 26.38,
            "rsi": 35.38
        },
        {
            "date": "2019-05-31T04:00:00.000Z",
            "last": 25.11,
            "rsi": 31.12
        },
        {
            "date": "2019-06-03T04:00:00.000Z",
            "last": 23.5,
            "rsi": 26.74
        },
        {
            "date": "2019-06-04T04:00:00.000Z",
            "last": 25.41,
            "rsi": 37.91
        },
        {
            "date": "2019-06-05T04:00:00.000Z",
            "last": 25.97,
            "rsi": 40.77
        },
        {
            "date": "2019-06-06T04:00:00.000Z",
            "last": 26.57,
            "rsi": 43.76
        },
        {
            "date": "2019-06-07T04:00:00.000Z",
            "last": 28.08,
            "rsi": 50.54
        },
        {
            "date": "2019-06-10T04:00:00.000Z",
            "last": 29.11,
            "rsi": 54.54
        },
        {
            "date": "2019-06-11T04:00:00.000Z",
            "last": 29.22,
            "rsi": 54.96
        },
        {
            "date": "2019-06-12T04:00:00.000Z",
            "last": 28.73,
            "rsi": 52.6
        },
        {
            "date": "2019-06-13T04:00:00.000Z",
            "last": 29.19,
            "rsi": 54.59
        },
        {
            "date": "2019-06-14T04:00:00.000Z",
            "last": 28.82,
            "rsi": 52.67
        },
        {
            "date": "2019-06-17T04:00:00.000Z",
            "last": 29.34,
            "rsi": 55.03
        },
        {
            "date": "2019-06-18T04:00:00.000Z",
            "last": 30.61,
            "rsi": 60.2
        },
        {
            "date": "2019-06-19T04:00:00.000Z",
            "last": 30.97,
            "rsi": 61.55
        },
        {
            "date": "2019-06-20T04:00:00.000Z",
            "last": 31.82,
            "rsi": 64.61
        },
        {
            "date": "2019-06-21T04:00:00.000Z",
            "last": 31.67,
            "rsi": 63.68
        },
        {
            "date": "2019-06-24T04:00:00.000Z",
            "last": 31.67,
            "rsi": 63.61
        },
        {
            "date": "2019-06-25T04:00:00.000Z",
            "last": 30.05,
            "rsi": 53.63
        },
        {
            "date": "2019-06-26T04:00:00.000Z",
            "last": 30.42,
            "rsi": 55.4
        },
        {
            "date": "2019-06-27T04:00:00.000Z",
            "last": 30.75,
            "rsi": 56.93
        },
        {
            "date": "2019-06-28T04:00:00.000Z",
            "last": 30.89,
            "rsi": 57.55
        },
        {
            "date": "2019-07-01T04:00:00.000Z",
            "last": 32.12,
            "rsi": 62.98
        },
        {
            "date": "2019-07-02T04:00:00.000Z",
            "last": 32.51,
            "rsi": 64.53
        },
        {
            "date": "2019-07-03T04:00:00.000Z",
            "last": 33.22,
            "rsi": 67.26
        },
        {
            "date": "2019-07-05T04:00:00.000Z",
            "last": 33.01,
            "rsi": 65.64
        },
        {
            "date": "2019-07-08T04:00:00.000Z",
            "last": 32.31,
            "rsi": 60.55
        },
        {
            "date": "2019-07-09T04:00:00.000Z",
            "last": 32.8,
            "rsi": 62.72
        },
        {
            "date": "2019-07-10T04:00:00.000Z",
            "last": 33.77,
            "rsi": 66.67
        },
        {
            "date": "2019-07-11T04:00:00.000Z",
            "last": 33.68,
            "rsi": 65.97
        },
        {
            "date": "2019-07-12T04:00:00.000Z",
            "last": 34.24,
            "rsi": 68.22
        },
        {
            "date": "2019-07-15T04:00:00.000Z",
            "last": 34.53,
            "rsi": 69.34
        },
        {
            "date": "2019-07-16T04:00:00.000Z",
            "last": 34.04,
            "rsi": 65.16
        },
        {
            "date": "2019-07-17T04:00:00.000Z",
            "last": 33.54,
            "rsi": 61.08
        },
        {
            "date": "2019-07-18T04:00:00.000Z",
            "last": 33.69,
            "rsi": 61.82
        },
        {
            "date": "2019-07-19T04:00:00.000Z",
            "last": 32.87,
            "rsi": 55.43
        },
        {
            "date": "2019-07-22T04:00:00.000Z",
            "last": 33.65,
            "rsi": 59.69
        },
        {
            "date": "2019-07-23T04:00:00.000Z",
            "last": 34.29,
            "rsi": 62.9
        },
        {
            "date": "2019-07-24T04:00:00.000Z",
            "last": 35.03,
            "rsi": 66.15
        },
        {
            "date": "2019-07-25T04:00:00.000Z",
            "last": 34.03,
            "rsi": 58.57
        },
        {
            "date": "2019-07-26T04:00:00.000Z",
            "last": 35.03,
            "rsi": 63.16
        },
        {
            "date": "2019-07-29T04:00:00.000Z",
            "last": 34.71,
            "rsi": 60.83
        },
        {
            "date": "2019-07-30T04:00:00.000Z",
            "last": 34.24,
            "rsi": 57.55
        },
        {
            "date": "2019-07-31T04:00:00.000Z",
            "last": 32.8,
            "rsi": 48.75
        },
        {
            "date": "2019-08-01T04:00:00.000Z",
            "last": 32.34,
            "rsi": 46.33
        },
        {
            "date": "2019-08-02T04:00:00.000Z",
            "last": 30.86,
            "rsi": 39.51
        },
        {
            "date": "2019-08-05T04:00:00.000Z",
            "last": 27.62,
            "rsi": 29.33
        },
        {
            "date": "2019-08-06T04:00:00.000Z",
            "last": 28.75,
            "rsi": 35.59
        },
        {
            "date": "2019-08-07T04:00:00.000Z",
            "last": 29.17,
            "rsi": 37.79
        },
        {
            "date": "2019-08-08T04:00:00.000Z",
            "last": 31.1,
            "rsi": 46.77
        },
        {
            "date": "2019-08-09T04:00:00.000Z",
            "last": 30.18,
            "rsi": 43.54
        },
        {
            "date": "2019-08-12T04:00:00.000Z",
            "last": 29.17,
            "rsi": 40.26
        },
        {
            "date": "2019-08-13T04:00:00.000Z",
            "last": 31.09,
            "rsi": 48.23
        },
        {
            "date": "2019-08-14T04:00:00.000Z",
            "last": 28.31,
            "rsi": 39.89
        },
        {
            "date": "2019-08-15T04:00:00.000Z",
            "last": 28.18,
            "rsi": 39.57
        },
        {
            "date": "2019-08-16T04:00:00.000Z",
            "last": 29.49,
            "rsi": 44.71
        },
        {
            "date": "2019-08-19T04:00:00.000Z",
            "last": 30.86,
            "rsi": 49.6
        },
        {
            "date": "2019-08-20T04:00:00.000Z",
            "last": 30.23,
            "rsi": 47.52
        },
        {
            "date": "2019-08-21T04:00:00.000Z",
            "last": 31,
            "rsi": 50.25
        },
        {
            "date": "2019-08-22T04:00:00.000Z",
            "last": 30.7,
            "rsi": 49.17
        },
        {
            "date": "2019-08-23T04:00:00.000Z",
            "last": 27.89,
            "rsi": 40.46
        },
        {
            "date": "2019-08-26T04:00:00.000Z",
            "last": 29.02,
            "rsi": 44.7
        },
        {
            "date": "2019-08-27T04:00:00.000Z",
            "last": 28.84,
            "rsi": 44.18
        },
        {
            "date": "2019-08-28T04:00:00.000Z",
            "last": 29.14,
            "rsi": 45.32
        },
        {
            "date": "2019-08-29T04:00:00.000Z",
            "last": 30.46,
            "rsi": 50.34
        },
        {
            "date": "2019-08-30T04:00:00.000Z",
            "last": 30.25,
            "rsi": 49.55
        },
        {
            "date": "2019-09-03T04:00:00.000Z",
            "last": 29.36,
            "rsi": 46.32
        },
        {
            "date": "2019-09-04T04:00:00.000Z",
            "last": 30.6,
            "rsi": 51.13
        },
        {
            "date": "2019-09-05T04:00:00.000Z",
            "last": 32.29,
            "rsi": 56.83
        },
        {
            "date": "2019-09-06T04:00:00.000Z",
            "last": 32.2,
            "rsi": 56.45
        },
        {
            "date": "2019-09-09T04:00:00.000Z",
            "last": 32,
            "rsi": 55.54
        },
        {
            "date": "2019-09-10T04:00:00.000Z",
            "last": 31.73,
            "rsi": 54.33
        },
        {
            "date": "2019-09-11T04:00:00.000Z",
            "last": 32.58,
            "rsi": 57.55
        },
        {
            "date": "2019-09-12T04:00:00.000Z",
            "last": 32.99,
            "rsi": 59.02
        },
        {
            "date": "2019-09-13T04:00:00.000Z",
            "last": 32.64,
            "rsi": 57.18
        },
        {
            "date": "2019-09-16T04:00:00.000Z",
            "last": 32.19,
            "rsi": 54.8
        },
        {
            "date": "2019-09-17T04:00:00.000Z",
            "last": 32.62,
            "rsi": 56.63
        },
        {
            "date": "2019-09-18T04:00:00.000Z",
            "last": 32.6,
            "rsi": 56.52
        },
        {
            "date": "2019-09-19T04:00:00.000Z",
            "last": 32.74,
            "rsi": 57.2
        },
        {
            "date": "2019-09-20T04:00:00.000Z",
            "last": 31.71,
            "rsi": 51.05
        },
        {
            "date": "2019-09-23T04:00:00.000Z",
            "last": 31.74,
            "rsi": 51.22
        },
        {
            "date": "2019-09-24T04:00:00.000Z",
            "last": 30.49,
            "rsi": 44.48
        },
        {
            "date": "2019-09-25T04:00:00.000Z",
            "last": 31.46,
            "rsi": 49.98
        },
        {
            "date": "2019-09-26T04:00:00.000Z",
            "last": 31.15,
            "rsi": 48.32
        },
        {
            "date": "2019-09-27T04:00:00.000Z",
            "last": 30.01,
            "rsi": 42.8
        },
        {
            "date": "2019-09-30T04:00:00.000Z",
            "last": 30.82,
            "rsi": 47.38
        },
        {
            "date": "2019-10-01T04:00:00.000Z",
            "last": 30.07,
            "rsi": 43.86
        },
        {
            "date": "2019-10-02T04:00:00.000Z",
            "last": 28.53,
            "rsi": 37.64
        },
        {
            "date": "2019-10-03T04:00:00.000Z",
            "last": 29.47,
            "rsi": 42.96
        },
        {
            "date": "2019-10-04T04:00:00.000Z",
            "last": 30.71,
            "rsi": 49.13
        },
        {
            "date": "2019-10-07T04:00:00.000Z",
            "last": 30.42,
            "rsi": 47.84
        },
        {
            "date": "2019-10-08T04:00:00.000Z",
            "last": 29.04,
            "rsi": 42.1
        },
        {
            "date": "2019-10-09T04:00:00.000Z",
            "last": 29.92,
            "rsi": 46.5
        },
        {
            "date": "2019-10-10T04:00:00.000Z",
            "last": 30.58,
            "rsi": 49.56
        },
        {
            "date": "2019-10-11T04:00:00.000Z",
            "last": 31.72,
            "rsi": 54.48
        },
        {
            "date": "2019-10-14T04:00:00.000Z",
            "last": 31.75,
            "rsi": 54.62
        },
        {
            "date": "2019-10-15T04:00:00.000Z",
            "last": 32.96,
            "rsi": 59.43
        },
        {
            "date": "2019-10-16T04:00:00.000Z",
            "last": 32.72,
            "rsi": 58.09
        },
        {
            "date": "2019-10-17T04:00:00.000Z",
            "last": 32.94,
            "rsi": 59.01
        },
        {
            "date": "2019-10-18T04:00:00.000Z",
            "last": 32,
            "rsi": 53.68
        },
        {
            "date": "2019-10-21T04:00:00.000Z",
            "last": 32.84,
            "rsi": 57.38
        },
        {
            "date": "2019-10-22T04:00:00.000Z",
            "last": 32.08,
            "rsi": 53.26
        },
        {
            "date": "2019-10-23T04:00:00.000Z",
            "last": 32.23,
            "rsi": 53.96
        },
        {
            "date": "2019-10-24T04:00:00.000Z",
            "last": 33.15,
            "rsi": 58.15
        },
        {
            "date": "2019-10-25T04:00:00.000Z",
            "last": 33.91,
            "rsi": 61.24
        },
        {
            "date": "2019-10-28T04:00:00.000Z",
            "last": 34.94,
            "rsi": 65.06
        },
        {
            "date": "2019-10-29T04:00:00.000Z",
            "last": 34.14,
            "rsi": 60.1
        },
        {
            "date": "2019-10-30T04:00:00.000Z",
            "last": 34.62,
            "rsi": 61.96
        },
        {
            "date": "2019-10-31T04:00:00.000Z",
            "last": 34.65,
            "rsi": 62.06
        },
        {
            "date": "2019-11-01T04:00:00.000Z",
            "last": 35.58,
            "rsi": 65.69
        },
        {
            "date": "2019-11-04T05:00:00.000Z",
            "last": 36.22,
            "rsi": 67.92
        },
        {
            "date": "2019-11-05T05:00:00.000Z",
            "last": 36.26,
            "rsi": 68.07
        },
        {
            "date": "2019-11-06T05:00:00.000Z",
            "last": 36.03,
            "rsi": 66.27
        },
        {
            "date": "2019-11-07T05:00:00.000Z",
            "last": 36.4,
            "rsi": 67.73
        },
        {
            "date": "2019-11-08T05:00:00.000Z",
            "last": 36.83,
            "rsi": 69.41
        },
        {
            "date": "2019-11-11T05:00:00.000Z",
            "last": 36.67,
            "rsi": 68.04
        },
        {
            "date": "2019-11-12T05:00:00.000Z",
            "last": 36.97,
            "rsi": 69.3
        },
        {
            "date": "2019-11-13T05:00:00.000Z",
            "last": 36.92,
            "rsi": 68.77
        },
        {
            "date": "2019-11-14T05:00:00.000Z",
            "last": 36.91,
            "rsi": 68.66
        },
        {
            "date": "2019-11-15T05:00:00.000Z",
            "last": 37.6,
            "rsi": 71.86
        },
        {
            "date": "2019-11-18T05:00:00.000Z",
            "last": 37.8,
            "rsi": 72.7
        },
        {
            "date": "2019-11-19T05:00:00.000Z",
            "last": 37.96,
            "rsi": 73.38
        },
        {
            "date": "2019-11-20T05:00:00.000Z",
            "last": 37.29,
            "rsi": 65.79
        },
        {
            "date": "2019-11-21T05:00:00.000Z",
            "last": 37,
            "rsi": 62.75
        },
        {
            "date": "2019-11-22T05:00:00.000Z",
            "last": 37.1,
            "rsi": 63.38
        },
        {
            "date": "2019-11-25T05:00:00.000Z",
            "last": 38.38,
            "rsi": 70.32
        },
        {
            "date": "2019-11-26T05:00:00.000Z",
            "last": 38.62,
            "rsi": 71.37
        },
        {
            "date": "2019-11-27T05:00:00.000Z",
            "last": 39.4,
            "rsi": 74.64
        },
        {
            "date": "2019-11-29T05:00:00.000Z",
            "last": 38.87,
            "rsi": 68.94
        },
        {
            "date": "2019-12-02T05:00:00.000Z",
            "last": 37.62,
            "rsi": 57.65
        },
        {
            "date": "2019-12-03T05:00:00.000Z",
            "last": 36.78,
            "rsi": 51.51
        },
        {
            "date": "2019-12-04T05:00:00.000Z",
            "last": 37.32,
            "rsi": 54.85
        },
        {
            "date": "2019-12-05T05:00:00.000Z",
            "last": 37.51,
            "rsi": 56.01
        },
        {
            "date": "2019-12-06T05:00:00.000Z",
            "last": 38.67,
            "rsi": 62.27
        },
        {
            "date": "2019-12-09T05:00:00.000Z",
            "last": 38.2,
            "rsi": 58.59
        },
        {
            "date": "2019-12-10T05:00:00.000Z",
            "last": 38.12,
            "rsi": 57.93
        },
        {
            "date": "2019-12-11T05:00:00.000Z",
            "last": 38.69,
            "rsi": 61.12
        },
        {
            "date": "2019-12-12T05:00:00.000Z",
            "last": 39.58,
            "rsi": 65.45
        },
        {
            "date": "2019-12-13T05:00:00.000Z",
            "last": 39.93,
            "rsi": 67.04
        },
        {
            "date": "2019-12-16T05:00:00.000Z",
            "last": 41.08,
            "rsi": 71.57
        },
        {
            "date": "2019-12-17T05:00:00.000Z",
            "last": 41.13,
            "rsi": 71.77
        },
        {
            "date": "2019-12-18T05:00:00.000Z",
            "last": 41.22,
            "rsi": 72.14
        },
        {
            "date": "2019-12-19T05:00:00.000Z",
            "last": 42.06,
            "rsi": 75.2
        },
        {
            "date": "2019-12-20T05:00:00.000Z",
            "last": 42.56,
            "rsi": 76.84
        },
        {
            "date": "2019-12-23T05:00:00.000Z",
            "last": 42.88,
            "rsi": 77.83
        },
        {
            "date": "2019-12-24T05:00:00.000Z",
            "last": 42.92,
            "rsi": 77.96
        },
        {
            "date": "2019-12-26T05:00:00.000Z",
            "last": 44.03,
            "rsi": 81.23
        },
        {
            "date": "2019-12-27T05:00:00.000Z",
            "last": 43.9,
            "rsi": 79.74
        },
        {
            "date": "2019-12-30T05:00:00.000Z",
            "last": 43.03,
            "rsi": 70.4
        },
        {
            "date": "2019-12-31T05:00:00.000Z",
            "last": 43.28,
            "rsi": 71.41
        }
    ],
    '2020': [
        {
            "date": "2020-01-02T05:00:00.000Z",
            "last": 45.42,
            "rsi": 78.37
        },
        {
            "date": "2020-01-03T05:00:00.000Z",
            "last": 44.19,
            "rsi": 68.09
        },
        {
            "date": "2020-01-06T05:00:00.000Z",
            "last": 45.03,
            "rsi": 70.89
        },
        {
            "date": "2020-01-07T05:00:00.000Z",
            "last": 44.97,
            "rsi": 70.45
        },
        {
            "date": "2020-01-08T05:00:00.000Z",
            "last": 46.01,
            "rsi": 73.72
        },
        {
            "date": "2020-01-09T05:00:00.000Z",
            "last": 47.17,
            "rsi": 76.82
        },
        {
            "date": "2020-01-10T05:00:00.000Z",
            "last": 46.78,
            "rsi": 73.71
        },
        {
            "date": "2020-01-13T05:00:00.000Z",
            "last": 48.42,
            "rsi": 77.82
        },
        {
            "date": "2020-01-14T05:00:00.000Z",
            "last": 47.85,
            "rsi": 73.55
        },
        {
            "date": "2020-01-15T05:00:00.000Z",
            "last": 47.88,
            "rsi": 73.63
        },
        {
            "date": "2020-01-16T05:00:00.000Z",
            "last": 49.22,
            "rsi": 77.07
        },
        {
            "date": "2020-01-17T05:00:00.000Z",
            "last": 49.95,
            "rsi": 78.71
        },
        {
            "date": "2020-01-21T05:00:00.000Z",
            "last": 49.92,
            "rsi": 78.51
        },
        {
            "date": "2020-01-22T05:00:00.000Z",
            "last": 50.26,
            "rsi": 79.3
        },
        {
            "date": "2020-01-23T05:00:00.000Z",
            "last": 50.73,
            "rsi": 80.37
        },
        {
            "date": "2020-01-24T05:00:00.000Z",
            "last": 49.42,
            "rsi": 69.45
        },
        {
            "date": "2020-01-27T05:00:00.000Z",
            "last": 46.36,
            "rsi": 51.82
        },
        {
            "date": "2020-01-28T05:00:00.000Z",
            "last": 48.51,
            "rsi": 59.61
        },
        {
            "date": "2020-01-29T05:00:00.000Z",
            "last": 48.69,
            "rsi": 60.17
        },
        {
            "date": "2020-01-30T05:00:00.000Z",
            "last": 49.24,
            "rsi": 61.97
        },
        {
            "date": "2020-01-31T05:00:00.000Z",
            "last": 46.82,
            "rsi": 51.07
        },
        {
            "date": "2020-02-03T05:00:00.000Z",
            "last": 48.97,
            "rsi": 58.12
        },
        {
            "date": "2020-02-04T05:00:00.000Z",
            "last": 52.31,
            "rsi": 66.26
        },
        {
            "date": "2020-02-05T05:00:00.000Z",
            "last": 52.92,
            "rsi": 67.49
        },
        {
            "date": "2020-02-06T05:00:00.000Z",
            "last": 54.21,
            "rsi": 70
        },
        {
            "date": "2020-02-07T05:00:00.000Z",
            "last": 53.51,
            "rsi": 66.98
        },
        {
            "date": "2020-02-10T05:00:00.000Z",
            "last": 55.44,
            "rsi": 70.73
        },
        {
            "date": "2020-02-11T05:00:00.000Z",
            "last": 55.48,
            "rsi": 70.81
        },
        {
            "date": "2020-02-12T05:00:00.000Z",
            "last": 57.1,
            "rsi": 73.72
        },
        {
            "date": "2020-02-13T05:00:00.000Z",
            "last": 56.88,
            "rsi": 72.66
        },
        {
            "date": "2020-02-14T05:00:00.000Z",
            "last": 57.27,
            "rsi": 73.38
        },
        {
            "date": "2020-02-18T05:00:00.000Z",
            "last": 57.37,
            "rsi": 73.58
        },
        {
            "date": "2020-02-19T05:00:00.000Z",
            "last": 59.03,
            "rsi": 76.63
        },
        {
            "date": "2020-02-20T05:00:00.000Z",
            "last": 57.35,
            "rsi": 68.06
        },
        {
            "date": "2020-02-21T05:00:00.000Z",
            "last": 54.07,
            "rsi": 55.11
        },
        {
            "date": "2020-02-24T05:00:00.000Z",
            "last": 47.84,
            "rsi": 39.67
        },
        {
            "date": "2020-02-25T05:00:00.000Z",
            "last": 43.97,
            "rsi": 33.4
        },
        {
            "date": "2020-02-26T05:00:00.000Z",
            "last": 44.58,
            "rsi": 35.13
        },
        {
            "date": "2020-02-27T05:00:00.000Z",
            "last": 37.91,
            "rsi": 26.87
        },
        {
            "date": "2020-02-28T05:00:00.000Z",
            "last": 38.5,
            "rsi": 28.48
        },
        {
            "date": "2020-03-02T05:00:00.000Z",
            "last": 43.76,
            "rsi": 40.9
        },
        {
            "date": "2020-03-03T05:00:00.000Z",
            "last": 39.63,
            "rsi": 35.67
        },
        {
            "date": "2020-03-04T05:00:00.000Z",
            "last": 44.44,
            "rsi": 44.58
        },
        {
            "date": "2020-03-05T05:00:00.000Z",
            "last": 40.54,
            "rsi": 39.77
        },
        {
            "date": "2020-03-06T05:00:00.000Z",
            "last": 38.42,
            "rsi": 37.4
        },
        {
            "date": "2020-03-09T04:00:00.000Z",
            "last": 30.61,
            "rsi": 30.27
        },
        {
            "date": "2020-03-10T04:00:00.000Z",
            "last": 35.38,
            "rsi": 38.04
        },
        {
            "date": "2020-03-11T04:00:00.000Z",
            "last": 30.83,
            "rsi": 34.13
        },
        {
            "date": "2020-03-12T04:00:00.000Z",
            "last": 22.38,
            "rsi": 28.31
        },
        {
            "date": "2020-03-13T04:00:00.000Z",
            "last": 28.42,
            "rsi": 36.63
        },
        {
            "date": "2020-03-16T04:00:00.000Z",
            "last": 18.62,
            "rsi": 30.46
        },
        {
            "date": "2020-03-17T04:00:00.000Z",
            "last": 21.66,
            "rsi": 34.16
        },
        {
            "date": "2020-03-18T04:00:00.000Z",
            "last": 19.66,
            "rsi": 32.91
        },
        {
            "date": "2020-03-19T04:00:00.000Z",
            "last": 20.11,
            "rsi": 33.5
        },
        {
            "date": "2020-03-20T04:00:00.000Z",
            "last": 17.75,
            "rsi": 31.93
        },
        {
            "date": "2020-03-23T04:00:00.000Z",
            "last": 17.81,
            "rsi": 32.01
        },
        {
            "date": "2020-03-24T04:00:00.000Z",
            "last": 21.78,
            "rsi": 37.72
        },
        {
            "date": "2020-03-25T04:00:00.000Z",
            "last": 21.27,
            "rsi": 37.29
        },
        {
            "date": "2020-03-26T04:00:00.000Z",
            "last": 24.74,
            "rsi": 42.15
        },
        {
            "date": "2020-03-27T04:00:00.000Z",
            "last": 22.17,
            "rsi": 39.7
        },
        {
            "date": "2020-03-30T04:00:00.000Z",
            "last": 24.5,
            "rsi": 42.94
        },
        {
            "date": "2020-03-31T04:00:00.000Z",
            "last": 23.82,
            "rsi": 42.23
        },
        {
            "date": "2020-04-01T04:00:00.000Z",
            "last": 20.86,
            "rsi": 39.18
        },
        {
            "date": "2020-04-02T04:00:00.000Z",
            "last": 22.1,
            "rsi": 41.09
        },
        {
            "date": "2020-04-03T04:00:00.000Z",
            "last": 21.21,
            "rsi": 40.11
        },
        {
            "date": "2020-04-06T04:00:00.000Z",
            "last": 25.65,
            "rsi": 46.92
        },
        {
            "date": "2020-04-07T04:00:00.000Z",
            "last": 25.6,
            "rsi": 46.85
        },
        {
            "date": "2020-04-08T04:00:00.000Z",
            "last": 27.24,
            "rsi": 49.31
        },
        {
            "date": "2020-04-09T04:00:00.000Z",
            "last": 27.33,
            "rsi": 49.47
        },
        {
            "date": "2020-04-13T04:00:00.000Z",
            "last": 28.28,
            "rsi": 50.99
        },
        {
            "date": "2020-04-14T04:00:00.000Z",
            "last": 31.95,
            "rsi": 56.45
        },
        {
            "date": "2020-04-15T04:00:00.000Z",
            "last": 30.9,
            "rsi": 54.56
        },
        {
            "date": "2020-04-16T04:00:00.000Z",
            "last": 32.55,
            "rsi": 56.98
        },
        {
            "date": "2020-04-17T04:00:00.000Z",
            "last": 33.37,
            "rsi": 58.16
        },
        {
            "date": "2020-04-20T04:00:00.000Z",
            "last": 32.28,
            "rsi": 55.97
        },
        {
            "date": "2020-04-21T04:00:00.000Z",
            "last": 28.72,
            "rsi": 49.34
        },
        {
            "date": "2020-04-22T04:00:00.000Z",
            "last": 31.25,
            "rsi": 53.55
        },
        {
            "date": "2020-04-23T04:00:00.000Z",
            "last": 31.05,
            "rsi": 53.17
        },
        {
            "date": "2020-04-24T04:00:00.000Z",
            "last": 32.55,
            "rsi": 55.68
        },
        {
            "date": "2020-04-27T04:00:00.000Z",
            "last": 33.19,
            "rsi": 56.73
        },
        {
            "date": "2020-04-28T04:00:00.000Z",
            "last": 31.39,
            "rsi": 52.89
        },
        {
            "date": "2020-04-29T04:00:00.000Z",
            "last": 34.65,
            "rsi": 58.41
        },
        {
            "date": "2020-04-30T04:00:00.000Z",
            "last": 34.88,
            "rsi": 58.77
        },
        {
            "date": "2020-05-01T04:00:00.000Z",
            "last": 31.75,
            "rsi": 52.06
        },
        {
            "date": "2020-05-04T04:00:00.000Z",
            "last": 32.88,
            "rsi": 54.08
        },
        {
            "date": "2020-05-05T04:00:00.000Z",
            "last": 33.92,
            "rsi": 55.95
        },
        {
            "date": "2020-05-06T04:00:00.000Z",
            "last": 34.6,
            "rsi": 57.16
        },
        {
            "date": "2020-05-07T04:00:00.000Z",
            "last": 35.94,
            "rsi": 59.55
        },
        {
            "date": "2020-05-08T04:00:00.000Z",
            "last": 37.4,
            "rsi": 62.01
        },
        {
            "date": "2020-05-11T04:00:00.000Z",
            "last": 38.33,
            "rsi": 63.54
        },
        {
            "date": "2020-05-12T04:00:00.000Z",
            "last": 36.04,
            "rsi": 57.43
        },
        {
            "date": "2020-05-13T04:00:00.000Z",
            "last": 34.68,
            "rsi": 54.08
        },
        {
            "date": "2020-05-14T04:00:00.000Z",
            "last": 35.83,
            "rsi": 56.39
        },
        {
            "date": "2020-05-15T04:00:00.000Z",
            "last": 36.44,
            "rsi": 57.62
        },
        {
            "date": "2020-05-18T04:00:00.000Z",
            "last": 38.56,
            "rsi": 61.61
        },
        {
            "date": "2020-05-19T04:00:00.000Z",
            "last": 38.26,
            "rsi": 60.75
        },
        {
            "date": "2020-05-20T04:00:00.000Z",
            "last": 40.5,
            "rsi": 64.77
        },
        {
            "date": "2020-05-21T04:00:00.000Z",
            "last": 39.26,
            "rsi": 61.03
        },
        {
            "date": "2020-05-22T04:00:00.000Z",
            "last": 39.61,
            "rsi": 61.71
        },
        {
            "date": "2020-05-26T04:00:00.000Z",
            "last": 39.44,
            "rsi": 61.17
        },
        {
            "date": "2020-05-27T04:00:00.000Z",
            "last": 40,
            "rsi": 62.35
        },
        {
            "date": "2020-05-28T04:00:00.000Z",
            "last": 39.74,
            "rsi": 61.43
        },
        {
            "date": "2020-05-29T04:00:00.000Z",
            "last": 41.38,
            "rsi": 65.02
        },
        {
            "date": "2020-06-01T04:00:00.000Z",
            "last": 41.9,
            "rsi": 66.08
        },
        {
            "date": "2020-06-02T04:00:00.000Z",
            "last": 42.73,
            "rsi": 67.8
        },
        {
            "date": "2020-06-03T04:00:00.000Z",
            "last": 43.31,
            "rsi": 68.97
        },
        {
            "date": "2020-06-04T04:00:00.000Z",
            "last": 42.43,
            "rsi": 65.09
        },
        {
            "date": "2020-06-05T04:00:00.000Z",
            "last": 44.94,
            "rsi": 70.24
        },
        {
            "date": "2020-06-08T04:00:00.000Z",
            "last": 45.94,
            "rsi": 72.01
        },
        {
            "date": "2020-06-09T04:00:00.000Z",
            "last": 46.97,
            "rsi": 73.74
        },
        {
            "date": "2020-06-10T04:00:00.000Z",
            "last": 48.67,
            "rsi": 76.33
        },
        {
            "date": "2020-06-11T04:00:00.000Z",
            "last": 41.5,
            "rsi": 52.65
        },
        {
            "date": "2020-06-12T04:00:00.000Z",
            "last": 42.4,
            "rsi": 54.55
        },
        {
            "date": "2020-06-15T04:00:00.000Z",
            "last": 43.9,
            "rsi": 57.61
        },
        {
            "date": "2020-06-16T04:00:00.000Z",
            "last": 46.22,
            "rsi": 61.89
        },
        {
            "date": "2020-06-17T04:00:00.000Z",
            "last": 46.67,
            "rsi": 62.68
        },
        {
            "date": "2020-06-18T04:00:00.000Z",
            "last": 47.03,
            "rsi": 63.33
        },
        {
            "date": "2020-06-19T04:00:00.000Z",
            "last": 46.96,
            "rsi": 63.12
        },
        {
            "date": "2020-06-22T04:00:00.000Z",
            "last": 48.63,
            "rsi": 66.28
        },
        {
            "date": "2020-06-23T04:00:00.000Z",
            "last": 49.9,
            "rsi": 68.49
        },
        {
            "date": "2020-06-24T04:00:00.000Z",
            "last": 46.96,
            "rsi": 58.86
        },
        {
            "date": "2020-06-25T04:00:00.000Z",
            "last": 48.21,
            "rsi": 61.34
        },
        {
            "date": "2020-06-26T04:00:00.000Z",
            "last": 44.74,
            "rsi": 51.96
        },
        {
            "date": "2020-06-29T04:00:00.000Z",
            "last": 46.17,
            "rsi": 55.02
        },
        {
            "date": "2020-06-30T04:00:00.000Z",
            "last": 48.83,
            "rsi": 60.1
        },
        {
            "date": "2020-07-01T04:00:00.000Z",
            "last": 50.57,
            "rsi": 63.05
        },
        {
            "date": "2020-07-02T04:00:00.000Z",
            "last": 51.65,
            "rsi": 64.78
        },
        {
            "date": "2020-07-06T04:00:00.000Z",
            "last": 55.44,
            "rsi": 70.1
        },
        {
            "date": "2020-07-07T04:00:00.000Z",
            "last": 54.35,
            "rsi": 66.97
        },
        {
            "date": "2020-07-08T04:00:00.000Z",
            "last": 56.44,
            "rsi": 69.76
        },
        {
            "date": "2020-07-09T04:00:00.000Z",
            "last": 57.85,
            "rsi": 71.5
        },
        {
            "date": "2020-07-10T04:00:00.000Z",
            "last": 59.08,
            "rsi": 72.96
        },
        {
            "date": "2020-07-13T04:00:00.000Z",
            "last": 55.42,
            "rsi": 62.66
        },
        {
            "date": "2020-07-14T04:00:00.000Z",
            "last": 56.6,
            "rsi": 64.4
        },
        {
            "date": "2020-07-15T04:00:00.000Z",
            "last": 56.88,
            "rsi": 64.82
        },
        {
            "date": "2020-07-16T04:00:00.000Z",
            "last": 55.66,
            "rsi": 61.41
        },
        {
            "date": "2020-07-17T04:00:00.000Z",
            "last": 55.92,
            "rsi": 61.87
        },
        {
            "date": "2020-07-20T04:00:00.000Z",
            "last": 60.68,
            "rsi": 69.13
        },
        {
            "date": "2020-07-21T04:00:00.000Z",
            "last": 58.74,
            "rsi": 63.8
        },
        {
            "date": "2020-07-22T04:00:00.000Z",
            "last": 59.42,
            "rsi": 64.82
        },
        {
            "date": "2020-07-23T04:00:00.000Z",
            "last": 54.76,
            "rsi": 53.63
        },
        {
            "date": "2020-07-24T04:00:00.000Z",
            "last": 53.15,
            "rsi": 50.37
        },
        {
            "date": "2020-07-27T04:00:00.000Z",
            "last": 56,
            "rsi": 55.51
        },
        {
            "date": "2020-07-28T04:00:00.000Z",
            "last": 53.9,
            "rsi": 51.29
        },
        {
            "date": "2020-07-29T04:00:00.000Z",
            "last": 55.73,
            "rsi": 54.53
        },
        {
            "date": "2020-07-30T04:00:00.000Z",
            "last": 56.63,
            "rsi": 56.08
        },
        {
            "date": "2020-07-31T04:00:00.000Z",
            "last": 59.69,
            "rsi": 60.93
        },
        {
            "date": "2020-08-03T04:00:00.000Z",
            "last": 61.92,
            "rsi": 64.04
        },
        {
            "date": "2020-08-04T04:00:00.000Z",
            "last": 62.72,
            "rsi": 65.12
        },
        {
            "date": "2020-08-05T04:00:00.000Z",
            "last": 63.22,
            "rsi": 65.81
        },
        {
            "date": "2020-08-06T04:00:00.000Z",
            "last": 65.64,
            "rsi": 69
        },
        {
            "date": "2020-08-07T04:00:00.000Z",
            "last": 63.49,
            "rsi": 63.36
        },
        {
            "date": "2020-08-10T04:00:00.000Z",
            "last": 62.64,
            "rsi": 61.21
        },
        {
            "date": "2020-08-11T04:00:00.000Z",
            "last": 59.08,
            "rsi": 53.14
        },
        {
            "date": "2020-08-12T04:00:00.000Z",
            "last": 63.51,
            "rsi": 60.17
        },
        {
            "date": "2020-08-13T04:00:00.000Z",
            "last": 63.95,
            "rsi": 60.81
        },
        {
            "date": "2020-08-14T04:00:00.000Z",
            "last": 63.76,
            "rsi": 60.38
        },
        {
            "date": "2020-08-17T04:00:00.000Z",
            "last": 65.87,
            "rsi": 63.55
        },
        {
            "date": "2020-08-18T04:00:00.000Z",
            "last": 67.81,
            "rsi": 66.23
        },
        {
            "date": "2020-08-19T04:00:00.000Z",
            "last": 66.48,
            "rsi": 62.83
        },
        {
            "date": "2020-08-20T04:00:00.000Z",
            "last": 69.21,
            "rsi": 66.64
        },
        {
            "date": "2020-08-21T04:00:00.000Z",
            "last": 70.66,
            "rsi": 68.48
        },
        {
            "date": "2020-08-24T04:00:00.000Z",
            "last": 71.97,
            "rsi": 70.09
        },
        {
            "date": "2020-08-25T04:00:00.000Z",
            "last": 73.65,
            "rsi": 72.06
        },
        {
            "date": "2020-08-26T04:00:00.000Z",
            "last": 78.36,
            "rsi": 76.71
        },
        {
            "date": "2020-08-27T04:00:00.000Z",
            "last": 77.65,
            "rsi": 74.69
        },
        {
            "date": "2020-08-28T04:00:00.000Z",
            "last": 78.86,
            "rsi": 75.85
        },
        {
            "date": "2020-08-31T04:00:00.000Z",
            "last": 80.68,
            "rsi": 77.52
        },
        {
            "date": "2020-09-01T04:00:00.000Z",
            "last": 84.87,
            "rsi": 80.82
        },
        {
            "date": "2020-09-02T04:00:00.000Z",
            "last": 87.26,
            "rsi": 82.41
        },
        {
            "date": "2020-09-03T04:00:00.000Z",
            "last": 73.86,
            "rsi": 54.99
        },
        {
            "date": "2020-09-04T04:00:00.000Z",
            "last": 70.82,
            "rsi": 50.85
        },
        {
            "date": "2020-09-08T04:00:00.000Z",
            "last": 60.81,
            "rsi": 40.14
        },
        {
            "date": "2020-09-09T04:00:00.000Z",
            "last": 66.04,
            "rsi": 46.48
        },
        {
            "date": "2020-09-10T04:00:00.000Z",
            "last": 62.22,
            "rsi": 42.9
        },
        {
            "date": "2020-09-11T04:00:00.000Z",
            "last": 60.85,
            "rsi": 41.67
        },
        {
            "date": "2020-09-14T04:00:00.000Z",
            "last": 63.99,
            "rsi": 45.55
        },
        {
            "date": "2020-09-15T04:00:00.000Z",
            "last": 66.71,
            "rsi": 48.73
        },
        {
            "date": "2020-09-16T04:00:00.000Z",
            "last": 63.51,
            "rsi": 45.36
        },
        {
            "date": "2020-09-17T04:00:00.000Z",
            "last": 60.58,
            "rsi": 42.48
        },
        {
            "date": "2020-09-18T04:00:00.000Z",
            "last": 58.24,
            "rsi": 40.28
        },
        {
            "date": "2020-09-21T04:00:00.000Z",
            "last": 58.93,
            "rsi": 41.25
        },
        {
            "date": "2020-09-22T04:00:00.000Z",
            "last": 62.15,
            "rsi": 45.67
        },
        {
            "date": "2020-09-23T04:00:00.000Z",
            "last": 56.4,
            "rsi": 39.89
        },
        {
            "date": "2020-09-24T04:00:00.000Z",
            "last": 57.22,
            "rsi": 41.04
        },
        {
            "date": "2020-09-25T04:00:00.000Z",
            "last": 61.23,
            "rsi": 46.42
        },
        {
            "date": "2020-09-28T04:00:00.000Z",
            "last": 64.86,
            "rsi": 50.79
        },
        {
            "date": "2020-09-29T04:00:00.000Z",
            "last": 64.18,
            "rsi": 49.97
        },
        {
            "date": "2020-09-30T04:00:00.000Z",
            "last": 65.45,
            "rsi": 51.55
        },
        {
            "date": "2020-10-01T04:00:00.000Z",
            "last": 68.51,
            "rsi": 55.22
        },
        {
            "date": "2020-10-02T04:00:00.000Z",
            "last": 62.87,
            "rsi": 48
        },
        {
            "date": "2020-10-05T04:00:00.000Z",
            "last": 66.83,
            "rsi": 52.68
        },
        {
            "date": "2020-10-06T04:00:00.000Z",
            "last": 63.24,
            "rsi": 48.43
        },
        {
            "date": "2020-10-07T04:00:00.000Z",
            "last": 66.57,
            "rsi": 52.27
        },
        {
            "date": "2020-10-08T04:00:00.000Z",
            "last": 67.54,
            "rsi": 53.37
        },
        {
            "date": "2020-10-09T04:00:00.000Z",
            "last": 70.55,
            "rsi": 56.67
        },
        {
            "date": "2020-10-12T04:00:00.000Z",
            "last": 77.13,
            "rsi": 62.87
        },
        {
            "date": "2020-10-13T04:00:00.000Z",
            "last": 77.14,
            "rsi": 62.88
        },
        {
            "date": "2020-10-14T04:00:00.000Z",
            "last": 75.24,
            "rsi": 60
        },
        {
            "date": "2020-10-15T04:00:00.000Z",
            "last": 73.68,
            "rsi": 57.68
        },
        {
            "date": "2020-10-16T04:00:00.000Z",
            "last": 72.55,
            "rsi": 55.98
        },
        {
            "date": "2020-10-19T04:00:00.000Z",
            "last": 68.94,
            "rsi": 50.84
        },
        {
            "date": "2020-10-20T04:00:00.000Z",
            "last": 69.39,
            "rsi": 51.43
        },
        {
            "date": "2020-10-21T04:00:00.000Z",
            "last": 69.21,
            "rsi": 51.16
        },
        {
            "date": "2020-10-22T04:00:00.000Z",
            "last": 69.25,
            "rsi": 51.22
        },
        {
            "date": "2020-10-23T04:00:00.000Z",
            "last": 69.65,
            "rsi": 51.87
        },
        {
            "date": "2020-10-26T04:00:00.000Z",
            "last": 66.47,
            "rsi": 46.59
        },
        {
            "date": "2020-10-27T04:00:00.000Z",
            "last": 68.04,
            "rsi": 49.34
        },
        {
            "date": "2020-10-28T04:00:00.000Z",
            "last": 60.06,
            "rsi": 38.49
        },
        {
            "date": "2020-10-29T04:00:00.000Z",
            "last": 63.12,
            "rsi": 43.6
        },
        {
            "date": "2020-10-30T04:00:00.000Z",
            "last": 58.72,
            "rsi": 38.63
        },
        {
            "date": "2020-11-02T05:00:00.000Z",
            "last": 58.74,
            "rsi": 38.67
        },
        {
            "date": "2020-11-03T05:00:00.000Z",
            "last": 61.7,
            "rsi": 43.67
        },
        {
            "date": "2020-11-04T05:00:00.000Z",
            "last": 70.04,
            "rsi": 54.87
        },
        {
            "date": "2020-11-05T05:00:00.000Z",
            "last": 75.44,
            "rsi": 60.37
        },
        {
            "date": "2020-11-06T05:00:00.000Z",
            "last": 75.7,
            "rsi": 60.61
        },
        {
            "date": "2020-11-09T05:00:00.000Z",
            "last": 71.08,
            "rsi": 54.12
        },
        {
            "date": "2020-11-10T05:00:00.000Z",
            "last": 67.25,
            "rsi": 49.38
        },
        {
            "date": "2020-11-11T05:00:00.000Z",
            "last": 71.76,
            "rsi": 54.44
        },
        {
            "date": "2020-11-12T05:00:00.000Z",
            "last": 70.71,
            "rsi": 53.11
        },
        {
            "date": "2020-11-13T05:00:00.000Z",
            "last": 72.57,
            "rsi": 55.19
        },
        {
            "date": "2020-11-16T05:00:00.000Z",
            "last": 74.24,
            "rsi": 57.04
        },
        {
            "date": "2020-11-17T05:00:00.000Z",
            "last": 73.56,
            "rsi": 56.02
        },
        {
            "date": "2020-11-18T05:00:00.000Z",
            "last": 71.85,
            "rsi": 53.46
        },
        {
            "date": "2020-11-19T05:00:00.000Z",
            "last": 73.63,
            "rsi": 55.73
        },
        {
            "date": "2020-11-20T05:00:00.000Z",
            "last": 72.14,
            "rsi": 53.37
        },
        {
            "date": "2020-11-23T05:00:00.000Z",
            "last": 72.15,
            "rsi": 53.39
        },
        {
            "date": "2020-11-24T05:00:00.000Z",
            "last": 75.1,
            "rsi": 57.51
        },
        {
            "date": "2020-11-25T05:00:00.000Z",
            "last": 76.51,
            "rsi": 59.36
        },
        {
            "date": "2020-11-27T05:00:00.000Z",
            "last": 78.61,
            "rsi": 62
        },
        {
            "date": "2020-11-30T05:00:00.000Z",
            "last": 79.01,
            "rsi": 62.51
        },
        {
            "date": "2020-12-01T05:00:00.000Z",
            "last": 82.11,
            "rsi": 66.23
        },
        {
            "date": "2020-12-02T05:00:00.000Z",
            "last": 82.44,
            "rsi": 66.61
        },
        {
            "date": "2020-12-03T05:00:00.000Z",
            "last": 82.78,
            "rsi": 67.02
        },
        {
            "date": "2020-12-04T05:00:00.000Z",
            "last": 83.79,
            "rsi": 68.28
        },
        {
            "date": "2020-12-07T05:00:00.000Z",
            "last": 85.21,
            "rsi": 70
        },
        {
            "date": "2020-12-08T05:00:00.000Z",
            "last": 86,
            "rsi": 70.93
        },
        {
            "date": "2020-12-09T05:00:00.000Z",
            "last": 80.24,
            "rsi": 56.86
        },
        {
            "date": "2020-12-10T05:00:00.000Z",
            "last": 81.22,
            "rsi": 58.38
        },
        {
            "date": "2020-12-11T05:00:00.000Z",
            "last": 80.65,
            "rsi": 57.12
        },
        {
            "date": "2020-12-14T05:00:00.000Z",
            "last": 82.37,
            "rsi": 59.92
        },
        {
            "date": "2020-12-15T05:00:00.000Z",
            "last": 84.93,
            "rsi": 63.72
        },
        {
            "date": "2020-12-16T05:00:00.000Z",
            "last": 86.36,
            "rsi": 65.67
        },
        {
            "date": "2020-12-17T05:00:00.000Z",
            "last": 88.12,
            "rsi": 67.97
        },
        {
            "date": "2020-12-18T05:00:00.000Z",
            "last": 87.17,
            "rsi": 65.41
        },
        {
            "date": "2020-12-21T05:00:00.000Z",
            "last": 86.84,
            "rsi": 64.52
        },
        {
            "date": "2020-12-22T05:00:00.000Z",
            "last": 87.53,
            "rsi": 65.58
        },
        {
            "date": "2020-12-23T05:00:00.000Z",
            "last": 86.21,
            "rsi": 61.76
        },
        {
            "date": "2020-12-24T05:00:00.000Z",
            "last": 87.32,
            "rsi": 63.69
        },
        {
            "date": "2020-12-28T05:00:00.000Z",
            "last": 89.94,
            "rsi": 67.8
        },
        {
            "date": "2020-12-29T05:00:00.000Z",
            "last": 90.21,
            "rsi": 68.19
        },
        {
            "date": "2020-12-30T05:00:00.000Z",
            "last": 90.19,
            "rsi": 68.14
        }
    ],
};