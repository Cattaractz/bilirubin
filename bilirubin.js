let myChart;

document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('biliChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                { label: 'Utskiftning', data: linesData.exchange, borderColor: 'black', borderDash: [5, 5], borderWidth: 1, pointRadius: 0 },
                { label: '>2500g', data: linesData.red, borderColor: 'red', borderWidth: 2, pointRadius: 0 },
                { label: '>2500g (34-37)', data: linesData.pink, borderColor: 'magenta', borderWidth: 2, pointRadius: 0 },
                { label: '1500-2500g', data: linesData.blue, borderColor: 'blue', borderWidth: 2, pointRadius: 0 },
                { label: '1000-1500g', data: linesData.cyan, borderColor: 'cyan', borderWidth: 2, pointRadius: 0 },
                { label: '<1000g', data: linesData.green, borderColor: '#39FF14', borderWidth: 2, pointRadius: 0 },
                { label: 'Målinger', data: [], borderColor: 'black', backgroundColor: 'black', borderWidth: 3, pointRadius: 6, showLine: true },
                { label: 'Trend', data: [], borderColor: 'black', borderDash: [3, 3], borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: { 
            responsive: true, 
            scales: { 
                x: { 
                    type: 'linear', min: 0, max: 14,
                    ticks: {
                        stepSize: 1,
                        autoSkip: false,
                        callback: function(value) { return [value, (value * 24) + 't']; },
                        font: function(context) {
                            const isHour = context.tick && context.tick.label && context.tick.label.length > 1;
                            return { size: isHour ? 10 : 12, weight: isHour ? 'normal' : 'bold' };
                        }
                    },
                    title: { display: true, text: 'Alder (Dager / Timer)', font: { weight: 'bold' } }
                }, 
                y: { min: 0, max: 450, title: { display: true, text: 'Bilirubin (µmol/L)', font: { weight: 'bold' } } } 
            } 
        }
    });
});

const linesData = {
    exchange: [ {x:0, y:200}, {x:3, y:400}, {x:14, y:400} ],
    red:      [ {x:0, y:133}, {x:0.5, y:133}, {x:0.51, y:154}, {x:0.999, y:154}, {x:1, y:175}, {x:3, y:350}, {x:14, y:350} ],
    pink:     [ {x:0, y:108}, {x:0.5, y:108}, {x:0.51, y:129}, {x:0.999, y:129}, {x:1, y:150}, {x:3, y:300}, {x:14, y:300} ],
    blue:     [ {x:0, y:100}, {x:0.5, y:100}, {x:0.51, y:123}, {x:0.999, y:123}, {x:1, y:150}, {x:4, y:250}, {x:14, y:250} ],
    cyan:     [ {x:0, y:100}, {x:0.5, y:100}, {x:0.51, y:100}, {x:0.999, y:100}, {x:1, y:125}, {x:4, y:200}, {x:14, y:200} ],
    green:    [ {x:0, y:100}, {x:0.5, y:100}, {x:0.51, y:100}, {x:0.999, y:100}, {x:1, y:100}, {x:4, y:150}, {x:14, y:150} ]
};

function switchTab(tabName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + tabName).classList.add('active');
    const tabIndex = tabName === 'nomogram' ? 0 : 1;
    document.querySelectorAll('.nav-item')[tabIndex].classList.add('active');
}

// ----------------------------------------------------
// Sjekk kun Prøve 1 
// ----------------------------------------------------
function checkSingleValue() {
    const t1_h = parseFloat(document.getElementById('n_t1').value);
    const v1 = parseFloat(document.getElementById('n_v1').value);
    const selectEl = document.getElementById('riskLine');
    const riskKey = selectEl.value;
    const resBox = document.getElementById('res-nomogram');
    
    if (isNaN(t1_h) || isNaN(v1)) {
        resBox.style.display = 'block';
        resBox.className = 'result-box warning';
        resBox.innerHTML = "⚠️ Vennligst fyll ut Alder og Bilirubin for Prøve 1.";
        return;
    }

    const t1_days = t1_h / 24;
    const limitSelected = getLimitAtTime(linesData[riskKey], t1_days);

    // Calculate all limits and their differences from the measured value (v1)
    const comparisonData = [
        { label: 'Utskiftning', key: 'exchange', color: '#000' },
        { label: 'Rød', key: 'red', color: 'red' },
        { label: 'Rosa', key: 'pink', color: 'magenta' },
        { label: 'Blå', key: 'blue', color: 'blue' },
        { label: 'Cyan', key: 'cyan', color: 'cyan' },
        { label: 'Grønn', key: 'green', color: '#39FF14' },
        
    ].map(item => {
        const limit = getLimitAtTime(linesData[item.key], t1_days);
        const diff = v1 - limit; // Calculated here as "diff"
        return { ...item, limit, diff };
    });

    const isOver = v1 >= limitSelected;
    const diffSelected = Math.abs(v1 - limitSelected);

    resBox.style.display = 'block';
    resBox.className = 'result-box ' + (isOver ? 'danger' : 'warning');

    let html = `
    <div class="status-header">
        ${isOver ? '🚨 Over valgt grense!' : '✅ Under valgt grense'}
    </div>
    <div style="color: #666; font-size: 0.85rem;">
        Måling ved ${t1_h} timer:
    </div>
    <span class="value-highlight" style="color: ${isOver ? '#dc3545' : '#28a745'}">
        ${v1} <small style="font-size: 0.9rem;">µmol/L</small>
    </span>
    <p style="margin: 5px 0; font-size: 0.9rem;">
        Det er <strong>${Math.round(diffSelected)} µmol/L</strong> ${isOver ? 'over' : 'under'} valgt grenseverdi på ${Math.round(limitSelected)}.
    </p>
    
    <hr style="border: 0; border-top: 1px solid #eee; margin: 12px 0;">
    
    <div style="font-weight: bold; font-size: 0.8rem; margin-bottom: 8px;">AVSTAND TIL GRENSEVERDIER VED ${t1_h}T:</div>
    <div class="comparison-grid">
        ${comparisonData.map(item => `
            <div class="comparison-item">
                <span class="comparison-label">
                    <span class="dot" style="background:${item.color};"></span> ${item.label}
                </span>
                <span class="comparison-value">${Math.round(item.limit)}</span>
                <div style="font-size: 0.75rem; margin-top: 4px; font-weight: bold; color: ${item.diff >= 0 ? '#dc3545' : '#28a745'};">
                    ${item.diff >= 0 ? '+' : ''}${Math.round(item.diff)}
                </div>
            </div>
        `).join('')}
    </div>
`;

    resBox.innerHTML = html;

    myChart.data.datasets[6].data = [{x: t1_days, y: v1}];
    myChart.data.datasets[7].data = [];
    myChart.update();
}

// ----------------------------------------------------
// Beregn trend mellom to prøver (Oppdatert UI)
// ----------------------------------------------------
function calcNomogram() {
    const t1_h = parseFloat(document.getElementById('n_t1').value);
    const v1 = parseFloat(document.getElementById('n_v1').value);
    const t2_h = parseFloat(document.getElementById('n_t2').value);
    const v2 = parseFloat(document.getElementById('n_v2').value);
    
    const selectEl = document.getElementById('riskLine');
    const riskKey = selectEl.value;
    const riskLabel = selectEl.options[selectEl.selectedIndex].text.split(':')[0];
    
    const curve = linesData[riskKey];
    const resBox = document.getElementById('res-nomogram');

    if(isNaN(t1_h) || isNaN(v1) || isNaN(t2_h) || isNaN(v2)) {
        resBox.style.display = 'block';
        resBox.className = 'result-box warning';
        resBox.innerHTML = "⚠️ Vennligst fyll ut alle feltene for både Prøve 1 og Prøve 2.";
        return;
    }

    const t1 = t1_h / 24;
    const t2 = t2_h / 24;
    const slope = (v2 - v1) / (t2 - t1);

    myChart.data.datasets[6].data = [{x:t1, y:v1}, {x:t2, y:v2}];
    myChart.data.datasets[7].data = [{x:t2, y:v2}, {x:14, y:v2 + (slope * (14 - t2))}];
    myChart.update();

    let currentLimitAtT2 = getLimitAtTime(curve, t2);

    let crossHour = null;
    for (let i = 0; i < curve.length - 1; i++) {
        let p1 = curve[i];
        let p2 = curve[i+1];
        if (p2.x === p1.x) continue; 

        let m2 = (p2.y - p1.y) / (p2.x - p1.x);
        let b2 = p1.y - m2 * p1.x;
        let b1 = v2 - slope * t2;
        let ix = (b2 - b1) / (slope - m2);

        if (ix >= p1.x && ix <= p2.x && ix >= t2) {
            crossHour = ix * 24;
            break; 
        }
    }

    let rate = (slope / 24).toFixed(2);
    
    const limitsAtT2 = {
        red: getLimitAtTime(linesData.red, t2),
        pink: getLimitAtTime(linesData.pink, t2),
        blue: getLimitAtTime(linesData.blue, t2),
        exchange: getLimitAtTime(linesData.exchange, t2)
    };

    let statusIcon = "✅";
    let statusText = "Under valgt grense";
    let statusColor = "#28a745";
    let boxClass = "warning"; // Safe/Under

    if (v2 >= currentLimitAtT2) {
        statusIcon = "🚨";
        statusText = "Over valgt grense!";
        statusColor = "#dc3545";
        boxClass = "danger";
    } else if (crossHour) {
        statusIcon = "⚠️";
        statusText = "Kan krysse grensen";
        statusColor = "#af8f02";
        boxClass = "warning";
    }

    resBox.style.display = 'block';
    resBox.className = 'result-box ' + boxClass;

    let html = `
        <div class="status-header">
            ${statusIcon} ${statusText}
        </div>
        <div style="color: #666; font-size: 0.85rem;">
            Siste måling (Prøve 2) ved ${t2_h} timer:
        </div>
        
        <div style="display: flex; gap: 15px; align-items: baseline; flex-wrap: wrap; margin-bottom: 5px;">
            <span class="value-highlight" style="color: ${statusColor}; display: inline-block;">
                ${v2} <small style="font-size: 0.9rem;">µmol/L</small>
            </span>
            <span style="font-size: 0.9rem; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; border: 1px solid #ddd;">
                📈 Stigningstakt: <strong>${rate}</strong> µmol/L/t
            </span>
        </div>
    `;

    if (v2 >= currentLimitAtT2) {
        html += `<p style="margin: 5px 0; font-size: 0.9rem;">Prøve 2 er over grenseverdien (${Math.round(currentLimitAtT2)}).</p>`;
    } else if (crossHour) {
        const days = Math.floor(crossHour / 24);
        const hours = Math.round(crossHour % 24);
        html += `<p style="margin: 5px 0; font-size: 0.9rem;"> Basert på disse målingene estimeres det at verdien kan krysse <strong>${riskLabel}</strong> ved ca. <strong>${Math.round(crossHour)} timer</strong>.</p>`;
    } else {
        html += `<p style="margin: 5px 0; font-size: 0.9rem;">Trenden forventes ikke å krysse grenseverdien innen 14 dager.</p>`;
    }

    const comparisonData2 = [
    { label: 'Utskift', key: 'exchange', color: '#000' },
    { label: 'Rød', key: 'red', color: 'red' },
    { label: 'Rosa', key: 'pink', color: 'magenta' },
    { label: 'Blå', key: 'blue', color: 'blue' },
    { label: 'Cyan', key: 'cyan', color: 'cyan' },
    { label: 'Grønn', key: 'green', color: '#39FF14' },
    
].map(item => {
    const limit = getLimitAtTime(linesData[item.key], t2);
    const diff = v2 - limit; 
    return { ...item, limit, diff };
});

// 2. Generate the HTML
html += `
    <hr style="border: 0; border-top: 1px solid #eee; margin: 12px 0;">
    <div style="font-weight: bold; font-size: 0.8rem; margin-bottom: 8px;">
        AVSTAND TIL GRENSEVERDIER VED ${t2_h} t (PRØVE 2):
    </div>
    <div class="comparison-grid">
        ${comparisonData2.map(item => `
            <div class="comparison-item">
                <span class="comparison-label">
                    <span class="dot" style="background:${item.color};"></span> ${item.label}
                </span>
                <span class="comparison-value">${Math.round(item.limit)}</span>
                <div style="font-size: 0.75rem; margin-top: 4px; font-weight: bold; color: ${item.diff >= 0 ? '#dc3545' : '#28a745'};">
                    ${item.diff >= 0 ? '+' : ''}${Math.round(item.diff)}
                </div>
            </div>
        `).join('')}
    </div>
`;

    resBox.innerHTML = html;
}

// ----------------------------------------------------
// PROTRAHERT BILIRUBIN (REBOUND)
// ----------------------------------------------------
function calcRebound() {
    const d1 = new Date(document.getElementById('r_d1').value);
    const v1 = parseFloat(document.getElementById('r_v1').value);
    const d2 = new Date(document.getElementById('r_d2').value);
    const v2 = parseFloat(document.getElementById('r_v2').value);
    const d3 = new Date(document.getElementById('r_d3').value);
    const v3 = parseFloat(document.getElementById('r_v3').value);
    const limit = parseFloat(document.getElementById('r_limit').value);
    const resBox = document.getElementById('res-rebound');

    resBox.style.display = 'block';
    resBox.className = 'result-box';

    if (isNaN(d1) || isNaN(v1) || isNaN(d2) || isNaN(v2) || isNaN(d3) || isNaN(v3) || isNaN(limit)) {
        resBox.className += " warning";
        resBox.innerHTML = "Sjekk at alle datoer og verdier er fylt ut.";
        return;
    }

    const diffHours1_2 = Math.abs(d2 - d1) / 3600000;
    const stigningPerTime = (v2 - v1) / diffHours1_2;
    const restTilGrense = limit - v3;

    let html = `<strong>Beregnet trend:</strong><br>`;
    html += `Stigningstakt: ${stigningPerTime.toFixed(2)} µmol/L per time.<br><br>`;

    if (stigningPerTime <= 0) {
        html += `Trenden er flat eller synkende.`;
        resBox.classList.add("warning");
    } else if (restTilGrense <= 0) {
        resBox.classList.add("danger");
        html += `<div class="result-big">GRENSE NÅDD</div>`;
    } else {
        const timerTilGrense = restTilGrense / stigningPerTime;
        const krysningDato = new Date(d3.getTime() + (timerTilGrense * 3600000));
        
        const datoStreng = krysningDato.toLocaleString('no-NO', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23' 
        });

        const dager = Math.floor(timerTilGrense / 24);
        const timer = Math.round(timerTilGrense % 24);

        resBox.classList.add("warning");
        html += `Beregnet tidspunkt for å nå lysgrenseverdi på ${limit} µmol/L:`;
        html += `<div class="result-big">${datoStreng}</div>`;
        html += `(Tilsvarer ca. ${dager} døgn og ${timer} timer etter siste prøve)`;
    }
    resBox.innerHTML = html;
}

function clearRebound() {
    document.getElementById('r_d1').value = '';
    document.getElementById('r_v1').value = '';
    document.getElementById('r_d2').value = '';
    document.getElementById('r_v2').value = '';
    document.getElementById('r_d3').value = '';
    document.getElementById('r_v3').value = '';
    document.getElementById('r_limit').value = '350';
    document.getElementById('res-rebound').style.display = 'none';
}

// ----------------------------------------------------
// HJELPEFUNKSJON: Finn grenseverdi for spesifikt tidspunkt
// ----------------------------------------------------
function getLimitAtTime(curve, timeInDays) {
    for (let i = 0; i < curve.length - 1; i++) {
        let p1 = curve[i];
        let p2 = curve[i+1];
        if (timeInDays >= p1.x && timeInDays <= p2.x) {
            if (p1.x === p2.x) return p2.y;
            let m = (p2.y - p1.y) / (p2.x - p1.x);
            return p1.y + m * (timeInDays - p1.x);
        }
    }
    return curve[curve.length - 1].y;
}