/*

Copyright (C) 2010 Felix Niessen (felix.niessen@googlemail.com || caendle.de) (Bewicklungsrechner XL)

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program; if not, see <http://www.gnu.org/licenses/>. 

__________________________________________

Mit bestem dank an:
- overclocker_2001 alias oc2k1 & DrM (drmalte@maltemedia.de) [unbekannter weise da es die email nichtmehr giebt] für den "normalen" bewicklungsrechner.
- Friedhelm S. für die Formeln und die Anleitung zur berechnung des Wickelfaktors
- und alle die mir im RCN geholfen haben :)

*/



//bei domredy starten
var isInit = false;
window.onDomReady = function(fn){
	if(window.addEventListener){
		window.addEventListener("DOMContentLoaded", fn, false);
	}else if(window.addEvent){
		window.addEvent('domready',fn);
	}else{
		document.onreadystatechange = function(){
			if(document.readyState == "interactive"  || document.readyState == "loaded" || document.readyState == "complete"){
				!isInit ? fn():0;
				isInit = true;				
			}
		}
        }
}
window.onDomReady(jsStart);

//für die einzelnen schritte
var v=window.location.search.substring(1, location.search.length).split('&');
var getVars = Array();
for(var i=0; i<v.length;i++){
	var temp = v[i].split('=');
	getVars[temp[0].toLowerCase()] = temp[1];
}
var act_schritt=1;
var nutenx = false;
var polex = false;
var schemax = false;
var schemay = false;
var schaltx = false;
var istSPS = false;
var verteilt = false;
var vonHand = false;
var SPSselector = document.createElement('select');
var schaltxy = false;
var verkuerzungValue = 0;
var schraegung_dazu=false;
var nutungsfaktor_dazu = false;
var fehlerV = false;


//für den wickelfactor
var WF = Array();
var WF1 = Array(Array(),Array());
var WF2 = Array(Array(),Array());
var WF3 = Array(Array(),Array());
var t = Array(0.25,0.55);


//wickelfacktor globsl
var w_factor = 0;
var s_advanced = false;
var ungenau = '';




//Sprachen
var lang = Array();

//Sprachen die zur auswahl stehen
lang[1] = 'de';
lang[2] = 'en';

// Die wörter in den verschiedenen sprachen

lang['nuten_de'] = 'Nuten';
lang['nuten_en'] = 'Slots';

lang['pole_de'] = 'Pole';
lang['pole_en'] = 'Magnet Poles';

lang['berechnen_de'] = 'Berechnen';
lang['berechnen_en'] = 'Calculate';

lang['kgv_de'] = 'KgV';
lang['kgv_en'] = 'LCM';

lang['rastetn1_de'] = 'Diese Nut/Pol kombination rastet voraussichtlich';
lang['rastetn1_en'] = 'This slot/magnet pole combination will have';

lang['rastetn2_de'] = 'mal pro Umdrehung';
lang['rastetn2_en'] = 'cogging steps per turn';

lang['kein_html5_de'] = '<p>Ihr Browser unterstützt kein HTML 5!<br />Grafische Darstellung nicht möglich.</p>';
lang['kein_html5_en'] = '<p>Your browser does not support HTML 5!<br /> graphical representation is not possible. </p>';

lang['nut_3_teilbar_de'] = 'Nutanzahl muss durch 3 teilbar sein!';
lang['nut_3_teilbar_en'] = 'Number of slots must be divisible by 3!';

lang['pol_grade_de'] = 'Polanzahl muss gerade sein!';
lang['pol_grade_en'] = 'Number of magnet poles must be divisible by 2!';

lang['nut_pol_ungleich_de'] = 'Polanzahl muss ungleich Nutanzahl sein!';
lang['nut_pol_ungleich_en'] = 'Magnet pole number and slot number must be different!';

lang['unausgewogen_de'] = 'Lösung unausgewogen!';
lang['unausgewogen_en'] = 'Unbalanced solution!';

lang['schritt_schritt_de'] = 'Schritt für Schritt';
lang['schritt_schritt_en'] = 'Winding animation';

lang['schritt_zurueck_de'] = 'Schritt zurück';
lang['schritt_zurueck_en'] = 'step back';

lang['schritt_vor_de'] = 'Nächster schritt';
lang['schritt_vor_en'] = 'next step';

lang['anfang_de'] = 'Anfang';
lang['anfang_en'] = 'Start';

lang['ende_de'] = 'Ende';
lang['ende_en'] = 'End';

lang['kein_wickelfaktor_de'] = 'Wickelfaktor berechnung nicht möglich. ';
lang['kein_wickelfaktor_en'] = 'Winding factor calculation is not possible.';

lang['wickelfaktor_de'] = 'Und hat einen Wickelfaktor von: ';
lang['wickelfaktor_en'] = 'And its winding factor is: ';

lang['erweitert_de'] = 'erweitert';
lang['erweitert_en'] = 'advanced';

lang['stator_d_de'] = 'Stator Durchmesser:';
lang['stator_d_en'] = 'Stator diameter:';

lang['nut_B_de'] = 'Nut Öffnung:';
lang['nut_B_en'] = 'Slot opening:';

lang['nutfaktor_de'] = 'Nutungsfaktor einbeziehen';
lang['nutfaktor_en'] = 'Involving the slot factor';

lang['einfach_de'] = 'einfach';
lang['einfach_en'] = 'simple';

lang['schema_de'] = 'Schema';
lang['schema_en'] = 'Scheme';

lang['hammer_leer_de'] = 'für leeren Hammer';
lang['hammer_leer_en'] = 'for empty hammer heads';

lang['teil_motor_de'] = 'um einen Teilmotor abzutrennen';
lang['teil_motor_en'] = 'to seperate a part motor';

lang['WF_tabelle_de'] = 'Wickelfaktoren für dieses Bewicklungschema';
lang['WF_tabelle_en'] = 'Winding factors for this winding scheme';

lang['WF_de'] = 'Wickelfaktor';
lang['WF_en'] = 'Winding factor';

lang['sieheauch_de'] = 'Siehe auch:';
lang['sieheauch_en'] = 'See also:'; 

lang['Schwankend_de'] = 'Unausgewogen!';
lang['Schwankend_en'] = 'Unbalanced!'; 

lang['inTabelle_de'] = 'in die Tabelle';
lang['inTabelle_en'] = 'into the table'; 

lang['schraegung1_de'] = 'Schrägung der Nuten';
lang['schraegung1_en'] = 'Skewed slots'; 

lang['schraegung2_de'] = 'Um wieviel Nuten wurde geschrägt';
lang['schraegung2_en'] = 'By how many slots is the skewing'; 

lang['Schwankend2_de'] = 'Wickelfaktor Schwankend! Anzeige nicht möglich';
lang['Schwankend2_en'] = 'Winding factor unbalanced! Representation is not possible.'; 

lang['kuerzung_de'] = "Verkürzung";
lang['kuerzung_en'] = "Shortening";

lang['schicht_de'] = "schicht";
lang['schicht_en'] = "layer";

//sprache finden
var selected_lang = 'en';
for(i = 1; i<lang.length;i++){
	if(navigator.userAgent.toLowerCase().indexOf('; '+lang[i]) !=-1){
		selected_lang = lang[i];
	}
}

//sprache wechseln
function setlang (id){
	selected_lang = id;
	jsStart();
}


// Initiieren
var mainContainer = false;
function jsStart(){
	mainContainer = document.getElementById('jsContainer');
	mainContainer.innerHTML = '';
	s_advanced = false;
	istSPS = false;
	var sprachwahl = '<ul>';
	for(i = 1; i<lang.length;i++){
		if(lang[i].length < 3){
			if(selected_lang == lang[i]){
				sprachwahl += '<li id="'+lang[i]+'" onclick="setlang(this.id);" style="color:#0000FF; font-weight:bold;">'+lang[i]+'</li>';
			}else{
				sprachwahl += '<li id="'+lang[i]+'" onclick="setlang(this.id);">'+lang[i]+'</li>';
			}
		}
	}
	sprachwahl += '</ul>';
	var form = ''
	form += '<form style="margin:auto;" name="Windungsrechner" action="javascript:return false;">';
	form += '<label for="Nuten" id="nuten_t">'+lang['nuten_'+selected_lang]+'</label>';
	form += '<input size="3"  maxlength="2" id="Nuten" name="Nuten" onchange="checkSPS(this.value,document.Windungsrechner.Pole.value,true);" />';
	form += '<label for="Pole">'+lang['pole_'+selected_lang]+'</label>';
	form += '<input maxlength="3" size="3" id="Pole" name="Pole" onchange="checkSPS(document.Windungsrechner.Nuten.value,this.value,true); checkVerteilt();" />';
	form += '<span id="schalti"><select id="schalt">';
	form += '<option value="-">D</option>';
	form += '<option value="Y">Y</option>';
	form += '</select></span>';
	form += '<input type="submit" onclick="berechnen(); return false;" id="Berechnen" value="'+lang['berechnen_'+selected_lang]+'" />';
	form += '<span id="erweitert_einfach" style=" font-size:12px;" onclick="schema_eingeben();"> &lArr; '+lang['erweitert_'+selected_lang]+'</span>';
	form += '</form><span id="info"></span>';
	
	mainContainer.innerHTML += sprachwahl;
	mainContainer.innerHTML += form;
	mainContainer.innerHTML += '<div id="Rasten"></div><div id="nutfacktor"></div><div id ="steps"></div><div id="Ergebnis"></div><div id="canvas_container"></div><div id="link_container"></div>';
	
	if(getVars['schema'] && getVars['pole'] && isNaN(getVars['schema'])){
		setTimeout('schema_eingeben()',20);
		setTimeout('document.Windungsrechner.Nuten.value="'+getVars['schema']+'"',30);
		setTimeout('document.Windungsrechner.Pole.value="'+getVars['pole']+'"',30);
		setTimeout('mit_schema()',40);
	}else if(getVars['nuten'] && getVars['pole'] && !isNaN(getVars['nuten'])){
		setTimeout('document.Windungsrechner.Nuten.value="'+getVars['nuten']+'"',30);
		setTimeout('document.Windungsrechner.Pole.value="'+getVars['pole']+'"',30);
		setTimeout('berechnen()',40);
		setTimeout('checkSPS(false,false,false)',45);
		setTimeout('checkVerteilt()',50);
	}
}


function checkVerteilt(){
	var NutenCv = document.Windungsrechner.Nuten.value;
	var PoleCv = document.Windungsrechner.Pole.value;
	NutenCv = NutenCv.replace(/ /g,'');
	var Lochzahl = NutenCv/3/PoleCv;
	var containerCV = document.getElementById('schalti');
	if(!schaltxy){
		schaltxy = containerCV.innerHTML;
	}
	if(!isNaN(NutenCv) && !istSPS && Lochzahl >= 1){
		containerCV.innerHTML = "&nbsp;"+lang['kuerzung_'+selected_lang];
		containerCV.innerHTML += '<input type="text" size="2" maxlength="1" id="verkuerzung" value="'+verkuerzungValue+'" />';
	}else if(Lochzahl < 1){
		containerCV.innerHTML = schaltxy;
	}else{
		containerCV.innerHTML = "";
	}
}



//checkt ob quasi SPS möglich ist, wenn ja dan giebts die auswahlmögl.
function checkSPS(NutenCx,PoleCx,refresh){
	var NutenCx  = document.Windungsrechner.Nuten.value;
	var PoleCx = document.Windungsrechner.Pole.value;
	NutenCx = NutenCx.replace(/ /g,'');
	
	if(NutenCx%2==0 && !isNaN(NutenCx)){
		SPSselector.name="SPSsel";
		SPSselector.onchange = function(){schaltSPS();}
		SPSselector.innerHTML ="";
		var SPSoption2 = document.createElement('option');
		SPSoption2.value = "SPS";
		SPSoption2.innerHTML = "1 "+lang['schicht_'+selected_lang];
		var SPSoption1 = document.createElement('option');
		SPSoption1.value = "-";
		SPSoption1.innerHTML = "2 "+lang['schicht_'+selected_lang];
		if(istSPS){
			SPSoption2.selected="selected";
			SPSselector.appendChild(SPSoption2);
			SPSselector.appendChild(SPSoption1);
		}else if(!istSPS){
			SPSoption1.selected="selected";
			SPSselector.appendChild(SPSoption1);
			SPSselector.appendChild(SPSoption2);
		}
		document.Windungsrechner.insertBefore(SPSselector,document.getElementById('schalti'));
	}else if(document.Windungsrechner.SPSsel){
		document.Windungsrechner.removeChild(SPSselector);
		if(refresh){
			istSPS = false;
		}
	}
}

function schaltSPS(){
	if(document.Windungsrechner.SPSsel.value == "SPS"){
		istSPS = true;
		verteilt = false;
		verkuerzungValue = 0;
		checkVerteilt();
	}else if(document.Windungsrechner.SPSsel.value == "-"){
		istSPS = false;
		verteilt = false;
		checkVerteilt();
	}
}



// schema erweitert / einfach
function schema_eingeben(){
	document.getElementById('nuten_t').innerHTML=lang['schema_'+selected_lang];
	document.getElementById('info').innerHTML = '<span style="color:#999; font-size:9px;">( - '+lang['hammer_leer_'+selected_lang]+')</span> &nbsp; <span style="color:#999; font-size:9px;">( / '+lang['teil_motor_'+selected_lang]+')</span>'
	document.getElementById('Nuten').size='35';
	document.getElementById('Nuten').maxLength='99';
	if(schemax && !verteilt){
		document.getElementById('Nuten').value = schemax;
	}else if(verteilt){
		document.getElementById('Nuten').value = verteilt;
	}
	document.getElementById('erweitert_einfach').innerHTML =' &lArr; '+lang['einfach_'+selected_lang];
	document.getElementById('erweitert_einfach').onclick=function(){nut_pol_eingeben();}
	document.getElementById('Berechnen').onclick = function(){mit_schema(); return false;}
	checkSPS(document.Windungsrechner.Nuten.value,document.Windungsrechner.Pole.value,false);
	checkVerteilt();
}
function nut_pol_eingeben(){
	document.getElementById('nuten_t').innerHTML=lang['nuten_'+selected_lang];
	document.getElementById('Nuten').size='3';
	document.getElementById('Nuten').maxLength='2';
	document.getElementById('info').innerHTML = '';
	if(schemax && !verteilt){
		document.getElementById('Nuten').value = schemax.length;
	}else if(verteilt){
		var nutZahL = verteilt.split('|');
		document.getElementById('Nuten').value = nutZahL.length-1;
	}
	document.getElementById('erweitert_einfach').innerHTML =' &lArr; '+lang['erweitert_'+selected_lang];
	document.getElementById('erweitert_einfach').onclick=function(){schema_eingeben();}
	document.getElementById('Berechnen').onclick = function(){berechnen(document.Windungsrechner); return false;}
	fehler = false;
	checkSPS(document.Windungsrechner.Nuten.value,document.Windungsrechner.Pole.value,false);
	checkVerteilt();
}



function mit_schema(){
	var SPS = false;
	var schema = document.getElementById('Nuten').value.replace(/ /g,'');
	schema = schema.replace(/U/g,'A');
	schema = schema.replace(/u/g,'a');
	schema = schema.replace(/V/g,'B');
	schema = schema.replace(/v/g,'b');
	schema = schema.replace(/W/g,'C');
	schema = schema.replace(/w/g,'c');
	if(schema.indexOf('|')!=-1){
		verteilt = true;
	}else{
		verteilt = false;
	}
	
	if(verteilt){
		verteilt = schema;
		var nutcount = schema.split('|');
		schema = "";
		for(i=0;i<nutcount.length;i++){
			schema = schema+"-";
		}
		schema = schema.replace(/\|/g,'').replace(/a/g,'').replace(/b/g,'').replace(/c/g,'');
	}
	
	schema.indexOf('-')!=-1?SPS = true:0;
	if(schema[0] == '-' && schema[schema.length-1]== '-'){
		schema = schema.substr(1);
	}else if(schema[0] != '-' && schema[schema.length-1]!= '-' && SPS && schema.length % 3 != 0){
		schema = schema+'-';
	}
	var schema_y = schema;
	schema = schema.replace(/\//g,'');
	var Nuten = schema.length;
	var Pole = document.getElementById('Pole').value;
	if( Nuten % 3 != 0 || Nuten < 3 ) {
		document.getElementById('Ergebnis').innerHTML = lang['nut_3_teilbar_'+selected_lang];
		document.Windungsrechner.Nuten.focus();
		document.Windungsrechner.Nuten.select();
		blink(document.Windungsrechner.Nuten.id);
		clear();
		return;
	}

	if( Pole % 2 != 0 || Pole < 2 ) {
		document.getElementById('Ergebnis').innerHTML  = lang['pol_grade_'+selected_lang];
		document.Windungsrechner.Pole.focus();
		document.Windungsrechner.Pole.select();
		blink(document.Windungsrechner.Pole.id);
		clear();
		return;
	}
	
	if( Pole == Nuten ) {
		document.getElementById('Ergebnis').innerHTML  = lang['nut_pol_ungleich_'+selected_lang];
		document.Windungsrechner.Pole.focus();
		document.Windungsrechner.Pole.select();
		blink(document.Windungsrechner.Pole.id);
		clear();
		return;
	}
	vonHand = true;
	Schema_ausgeben(Nuten,Pole,schema,false,SPS,schema_y);
}







// Schema färben, KgV berechnen
function Schema_ausgeben(nuten,pole,schema,fehler,SPS,schema_y){
	nutenx = nuten;
	schemax = schema;
	schemay = schema_y;
	polex = pole;
	s_advanced = false;
	var ergebnis = document.getElementById('Ergebnis');
	var farbiges_ergebniss = '';
	
	//Buchstaben färben
	if(!verteilt){
		for(y=0;y<schema_y.length;y++){
			text_color = farbe_zu (schema_y[y]);
			farbiges_ergebniss += '<span id="s_'+(y+1)+'" style="color:'+text_color+';">'+schema_y[y]+'</span>';
		}
	}else{
		var ohnestator = verteilt.replace(/\|/g,'');
		for(i=0;i<ohnestator.length;i++){
			if(ohnestator[0] == ohnestator[ohnestator.length-1]){
				var zwischen_Z = ohnestator[ohnestator.length-1];
				ohnestator = zwischen_Z+ohnestator.substring(0,ohnestator.length-1);
			}else{
				break;
			}
		}
		verteilt = "";
		for(i=0;i<ohnestator.length;i++){
			verteilt += ohnestator[i]+'|';
		}
		if(!istSPS && !vonHand){
			var ZweiSchichtV = "";
			for(y=0;y<verteilt.length;y++){
				if(verteilt[y]!='|' && verteilt[y]!='/' && verteilt[y]!='-'){
					ZweiSchichtV+=verteilt[y]+verteilt[y];
				}else{
					ZweiSchichtV+=verteilt[y];
				}
			}
			verteilt = ZweiSchichtV;
		}
		for(y=0;y<verteilt.length;y++){
			text_color = farbe_zu (verteilt[y]);
			farbiges_ergebniss += '<span id="s_'+(y+1)+'" style="color:'+text_color+';">'+verteilt[y]+'</span>';
		}
	}
	if(document.getElementById('verkuerzung') && !isNaN(document.getElementById('verkuerzung').value) && !istSPS && verteilt){
		var um_verkuertzt = document.getElementById('verkuerzung').value;
		verkuerzungValue = um_verkuertzt;
		var nutbelag_xx = verteilt.split('|');	
		var erste_schicht = ""; 
		var zweite_schicht = "";
		for(i=0;i<nutbelag_xx.length-1;i++){
			erste_schicht += nutbelag_xx[i][1];
			zweite_schicht += nutbelag_xx[i][0];
		}
		var verteilt_neu = "";
		
		for(i=0;i<um_verkuertzt;i++){
			var zwischen_Z = erste_schicht[0];
			erste_schicht = erste_schicht.substring(1)+zwischen_Z;
		}
		for(i=0;i<nutbelag_xx.length-1;i++){
			verteilt_neu += erste_schicht[i]+zweite_schicht[i]+'|';
		}
		verteilt=verteilt_neu;
		farbiges_ergebniss = "";
		for(y=0;y<verteilt.length;y++){
			text_color = farbe_zu (verteilt[y]);
			farbiges_ergebniss += '<span id="s_'+(y+1)+'" style="color:'+text_color+';">'+verteilt[y]+'</span>';
		}
	}
	
	if(!verteilt){
		var schritt_div = document.getElementById('steps');
		schritt_div.innerHTML = "<span></span>";
		schritt_div.firstChild.innerHTML = lang['schritt_schritt_'+selected_lang];
		schritt_div.firstChild.onclick = function(){schritt_fur_schritt();}
		act_schritt=1;
	}else{
		document.getElementById('steps').innerHTML='';
	}
	
	
	if(fehler){
		ergebnis.innerHTML = fehler+"( "+farbiges_ergebniss+" )";
		fehlerV = true;
	}else{
		ergebnis.innerHTML = farbiges_ergebniss;
		fehlerV = false;
	}
	//KgV errechnen
	var KgV = false;
	a = nuten;
	b = pole;
	x = a;
	y = b; 
        
	while (x<y||x>y){
		if (x-y<0){
			x=x*1+a*1;
		}else{
			y=y*1+b*1;
		}
        
		}
	KgV = x;
		
	document.getElementById('Rasten').innerHTML = lang['rastetn1_'+selected_lang]+' <span style="font-weight:bold;">'+KgV+'</span> '+lang['rastetn2_'+selected_lang]+'. <span style="font-size:10px; color:#999; font-style:italic;">'+lang['kgv_'+selected_lang]+'('+nuten+','+pole+')</span>';
	document.getElementById('Rasten').style.borderBottom = "1px solid #000";
	if(document.getElementById('schalt')){
		var schaltung = document.getElementById('schalt').value;
	}else{
		var schaltung  = '-';
	}
	schaltung  == '-' ? schaltung= false:0;
	
	schaltx = schaltung;
	drawStator(nuten,schema_y,false,schaltung);
	WF_FFT(schema,SPS);
	Wickel_Faktor_zeigen();
	gen_tabelle(WF);
	if(nutungsfaktor_dazu){
		document.getElementById('WFMN').checked = "checked";
		w_n_factor();
	}
	if(schraegung_dazu){
		document.getElementById('WFMS').checked = "checked";
		w_s_factor();
	}
		
	//weiteführende links finden
	var alle_links = document.getElementsByTagName('a');
	var link_container = document.getElementById('link_container');
	link_container.innerHTML = '';
	var weitere_links = Array();
	for(i=0;i<alle_links.length;i++){
		if(alle_links[i].className == 'N_'+nuten+'_'+'P_'+pole){
			weitere_links[weitere_links.length] = alle_links[i];
		}
	}
	if(weitere_links[0] && weitere_links[0] != ''){
		var w_links = '<div>'+lang['sieheauch_'+selected_lang]+'</div><ul>';
		for(i=0;i<weitere_links.length;i++){
			w_links += '<li><a href="'+weitere_links[i].href+'">'+weitere_links[i].innerHTML+'</a></li>';
		}
		link_container.innerHTML = w_links+'</ul>';
	}
	if(document.getElementById('WFMN')){
		if(!nutungsfaktor_dazu){
			document.getElementById('WFMN').checked = false;
		}
		if(!schraegung_dazu){
			document.getElementById('WFMS').checked = false;
		}
	}
	if(!s_advanced){
		gen_SAnzeige();
	}
}

function Wickel_Faktor_zeigen(){
	if(WF[0][(polex/2)-1]==WF[1][(polex/2)-1]){
		w_factor = WF[0][(polex/2)-1];
	}else{
		w_factor = '<span style="color:#CC0000;">'+lang['Schwankend_'+selected_lang]+'</span>'
	}
	
	if(document.getElementById('wf_tabelle')){
		einf_erw = '<span id="advanced" onclick="z_einfach();"> <span style="font-size:14px;">&uArr;</span> '+lang['einfach_'+selected_lang]+'</span>';
	}else{
		einf_erw = '<span id="advanced" onclick="advanced();"> <span style="font-size:14px;">&dArr;</span> '+lang['erweitert_'+selected_lang]+'</span>';
	}
	
	document.getElementById('Rasten').innerHTML += '<br />'+lang['wickelfaktor_'+selected_lang]+'<span style="font-weight:bold;">'+w_factor+'</span> '+einf_erw;
	
	
}




// nutfaktor felder einblenden
function advanced(){
	if(!s_advanced){
		var w_und_nut ='<div id="wf_auswahl" style="margin-bottom:5px; font-weight:bold;">'+lang['WF_tabelle_'+selected_lang]+'</div><table id="special" border="0" width="100%" cellpadding="0" cellspacing="2">';
		w_und_nut +='<tr>';
		w_und_nut +='<td style="text-align:left; font-weight:bold;">'+lang['nutfaktor_'+selected_lang]+'</td><td>'+lang['stator_d_'+selected_lang]+' </td><td style="text-align:left;"> <input style="font-size:10px;" onblur="w_n_factor();"  onchange="w_n_factor();" type="text" size="3" id="statorD" /> mm</td><td>'+lang['nut_B_'+selected_lang]+' </td><td style="text-align:left;"><input onchange="w_n_factor();" onblur="w_n_factor();" style="font-size:10px;" type="text" size="3" id="nutB" /> mm</td><td>'+lang['inTabelle_'+selected_lang]+'<input id="WFMN" onchange="w_n_factor();" type="checkbox" /></td>';
		w_und_nut +='</tr>';
		w_und_nut +='<tr>';
		w_und_nut +='<td style="text-align:left; font-weight:bold;">'+lang['schraegung1_'+selected_lang]+'</td><td colspan="3">'+lang['schraegung2_'+selected_lang]+': </td><td><input  style="font-size:10px;" type="text" size="3" onchange="w_s_factor();" onblur="w_s_factor();" id="schraegung" /> '+lang['nuten_'+selected_lang]+'</td><td style="text-align:left;">'+lang['inTabelle_'+selected_lang]+'<input onchange="w_s_factor();" id="WFMS" type="checkbox" /></td>';
		w_und_nut +='</tr>';
		w_und_nut +='</table><div id="WFschwankung"></div><div id="wf_tabelle"></div>';

		document.getElementById('nutfacktor').innerHTML += w_und_nut;
		s_advanced = true;
		document.getElementById('advanced').innerHTML=' <span style="font-size:14px;">&uArr;</span> '+lang['einfach_'+selected_lang];
		document.getElementById('advanced').onclick= function(){z_einfach();}
		gen_SAnzeige();
		gen_tabelle(WF);
	}
	gen_SAnzeige();
}
var darfleufen=false;
function gen_SAnzeige(){
	if(!verteilt){
		var AZcontainer = document.getElementById("WFschwankung");
		AZcontainer.innerHTML = '';
		if(!verteilt){
			var started = false;
			var AnzeigeInhalt = "";
			AnzeigeInhalt += '<span style="font-weight:bold;">Windungen:</span><div style="font-size:11px;">';
			var zaehler = 0
			for(i=0;i<schemax.length;i++){
				if(zaehler ==0){AnzeigeInhalt += '<div style="margin:2px; background-color:#EAEAEA;">';}
				if(schemax[i]!='-'){
					AnzeigeInhalt += schemax[i]+'<input type="text" size="1" style="width:20px;" id="gAZ_'+[i]+'" value="1" />&nbsp;';
				}else{
					AnzeigeInhalt += schemax[i]+'<input type="text" size="1" style="width:20px;" id="gAZ_'+[i]+'" value="0" disabled="disabled" />&nbsp;';
				}
				zaehler++;
				if(zaehler ==20){AnzeigeInhalt += '<div>'; zaehler = 0; }
			}
			if(zaehler !=0){AnzeigeInhalt += '<div>'; zaehler = 0; }
			AnzeigeInhalt += '<br /><br /><input type="button" style="cursor:pointer; cursor:hand;" onclick="startAnim()" value="Animation zeigen" />';
			AnzeigeInhalt += '<div id="animationC"></div></div>';
			AZcontainer.innerHTML=AnzeigeInhalt;
		}
	}
}
var ergebnisse = Array();
function startAnim(){
	document.getElementById('animationC').innerHTML="";
	var GZfehler = false;
	var windungszahlen = Array();
	for(i=0;i<schemax.length;i++){
		var GZahl = document.getElementById("gAZ_"+[i]).value;
		windungszahlen[windungszahlen.length] = GZahl;
		if(GZahl == '' || isNaN(GZahl)){
			blink("gAZ_"+[i]);
			GZfehler = true;
		}
	}
	if(!GZfehler){
		var maxnutb = 1;
		for(k=0;k<windungszahlen.length;k++){
			var Z1 = 0;
			var Z2 = 0;
			
			Z1 = windungszahlen[k];
			if(i=0){
				Z2 = windungszahlen[windungszahlen.length-1];
			}else{
				Z2 = windungszahlen[k-1];
			}
			var maxnbtest = parseInt(Z1)+parseInt(Z2);
			if(maxnbtest>maxnutb){
				maxnutb = maxnbtest;
			}
		}
		var berWFs = holWFs(schemax,windungszahlen,polex,maxnutb);
	}
}

function holWFs(schemax,windungszahlen,polek,maxnutb){
	ergebnisse = Array();
	for(tg=0;tg<400;tg++){
		var testXS = WF_FFTschnell(schemax,windungszahlen,polek,(tg/100),maxnutb);
		ergebnisse[ergebnisse.length]  = testXS;
	}
	darfleufen=false;
	setTimeout('Ezeigen();',150);
}


function Ezeigen(){
	var anzCont = document.getElementById('animationC');
	var xmin = 1;
	var xmax = 0;
	var xschnitt = 0;
	for(e=0;e<ergebnisse.length;e++){
		if(xmin>ergebnisse[e]){xmin = ergebnisse[e];}
		if(xmax<ergebnisse[e]){xmax = ergebnisse[e];}
		xschnitt = xschnitt+ergebnisse[e];
	}
	xschnitt = Math.round((xschnitt/ergebnisse.length)* 100000) / 100000;
	
	
	
	var anzContI = '<table width="100%" border="0" cellpadding="1" cellspacing="0">';
	anzContI += '<tr><td width="80%"><table height="250" width="100%" border="0" cellpadding="1" cellspacing="0"><tr>';
	for(y2=17; y2>0;y2--){
		anzContI += '<td colspan="2" height="11" id="anzT_'+y2+'" valign="bottom" style="font-size:9px;"></td>';
	}
	anzContI += '</tr>';
	anzContI += '<tr>';
	for(y2=34; y2>0;y2--){
		anzContI += '<td height="238" valign="bottom"><div style="width:15px; height:0px; background-color:#339966;" id="anz_'+y2+'"></div></td>';
	}
	anzContI += '</tr></table></td><td width="20%"><table height="250" width="100%" border="0" cellpadding="1" cellspacing="0">';
	anzContI += '<tr>';
	anzContI += '<td height="16%" id="minWF" valign="top">time</td>';
	anzContI += '</tr>';
	anzContI += '<tr>';
	anzContI += '<td height="28%" id="minWF" valign="top">max:<br />'+xmax+'</td>';
	anzContI += '</tr>';
	anzContI += '<tr>';
	anzContI += '<td height="28%" id="maxWF" valign="middle">schnitt:<br />'+xschnitt+'</td>';
	anzContI += '</tr>';
	anzContI += '<tr>';
	anzContI += '<td height="28%" id="schnittWF" valign="bottom">min:<br />'+xmin+'</td>';
	anzContI += '</tr>';
	anzContI += '</table></td></tr></table>';
	darfleufen=true;
	anzCont.innerHTML=anzContI;
	startesx(0);
}

function startesx(a_count){
	if(darfleufen){
		if(a_count>=400){
			a_count = 0;
			setTimeout('Tanzeigen('+a_count+')',200);
		}else{
			setTimeout('Tanzeigen('+a_count+')',60);
		}
	}
}

function Tanzeigen(a_count){
	for(y3=1; y3<34;y3++){
		if(ergebnisse[a_count-y3]){
			document.getElementById('anz_'+y3).style.height = Math.round(ergebnisse[a_count-y3]*236)+"px"
			if(y3%2==0){
				document.getElementById('anzT_'+(y3/2)).innerHTML = ((a_count-y3)/100);
			}
		}else{
			document.getElementById('anz_'+y3).style.height = 0+"px"
			if(y3%2==0){
				document.getElementById('anzT_'+(y3/2)).innerHTML = '';
			}
		}
	}
	a_count = a_count+1
	startesx(a_count);
}	



function z_einfach(){
	s_advanced = false;
	document.getElementById('nutfacktor').innerHTML = '';
	document.getElementById('advanced').innerHTML=' <span style="font-size:14px;">&dArr;</span> '+lang['erweitert_'+selected_lang];
	document.getElementById('advanced').onclick= function(){advanced();}
	
}

function gen_tabelle(WFA){
	if(document.getElementById('wf_tabelle')){
		var WFtabelle = document.getElementById('wf_tabelle');

		var Tanzeige = '<table border="0" cellspacing="1" cellpadding="0" width="100%" style="border-bottom:1px solid #000; padding-bottom:5px; padding-top:5px;">';
		Tanzeige += '<tr><td style="border:1px solid #CCC; border-left:none; border-top:none; font-weight:bold;" width="35">'+lang['pole_'+selected_lang]+'</td><td  width="35" style="border:1px solid #CCC; border-left:none; border-top:none; font-weight:bold;">time</td><td style=" font-weight:bold; border:1px solid #CCC;border-left:none; border-right:none; border-top:none;">'+lang['WF_'+selected_lang]+'</td></tr>';	
		
		var bg_farbe = "#EAEAEA";
		for(i=0;i<(nutenx*2);i++){
			
			for(T=0;T<t.length;T++){
				if(WFA[T][i] >1){
					WFA[T][i] = "err"
				}
				if(WFA[0][i] > 0 && WFA[0][i] == WFA[1][i]){
					if(T==0){
						var balkenfarbe = "#339966";
					}else{
						var balkenfarbe = "#55BB88";
					}
				}else{
					if(WFA[0][i] != WFA[1][i]){
						if(T==0){
							var balkenfarbe = "#CC0000";
						}else{
							var balkenfarbe = "#FF2222";
						}
					}else{
						var balkenfarbe = "#CC0000";
					}
				}
				Tanzeige += '<tr><td style="background:'+bg_farbe+'; border-right:1px solid #CCC;">'+(i+1)*2+'</td><td style="background:'+bg_farbe+'; border-right:1px solid #CCC;">'+t[T]+'</td><td style="background:'+bg_farbe+';"><div style="background:'+balkenfarbe+'; width:'+Math.round(WFA[T][i]*520)+'px; float:left;">&nbsp</div><div style="float:left;"> &nbsp;'+WFA[T][i]+'</div></td></tr>';
			}
			if(bg_farbe == "#EAEAEA"){
				bg_farbe = "";
			}else{
				bg_farbe = "#EAEAEA";
			}
		}
		
		Tanzeige += '</table>';
		WFtabelle.innerHTML = Tanzeige;
		document.getElementById('special').style.display= "table";
		document.getElementById('wf_auswahl').style.display= "block";
	}
}




//Wickelfaktor mit nutfaktor berechnen
function w_n_factor(){
	if(document.getElementById('WFMN') && document.getElementById('WFMN').checked == true){
		if(document.getElementById('WFMS') && document.getElementById('WFMS').checked == true){
			var alterWF = WF2;
		}else{
			var alterWF = WF;
		}
		
		if(document.getElementById('statorD') && document.getElementById('nutB')){
			var SDa = document.getElementById('statorD').value;
			var bs = document.getElementById('nutB').value;
			SDa = SDa.replace(/,/,'.');
			bs = bs.replace(/,/,'.');
		}
		if(SDa != 0 && SDa!='' && bs!=0 && bs!='' && !isNaN(SDa) && !isNaN(bs)){
			for(i=0;i<alterWF.length;i++){
				for(y=0;y<alterWF[i].length;y++){
					var w_factor_m_nut2 = WF[i][y]*(Math.sin((y+1)*bs/SDa)/((y+1)*bs/SDa));
					w_factor_m_nut2 = Math.round(w_factor_m_nut2 * 100000) / 100000;					
					WF1[i][y] = w_factor_m_nut2;
					if(document.getElementById('WFMS') && document.getElementById('WFMS').checked == true){
						var w_factor_m_nut = alterWF[i][y]*(Math.sin((y+1)*bs/SDa)/((y+1)*bs/SDa));
						w_factor_m_nut = Math.round(w_factor_m_nut * 100000) / 100000;
						WF3[i][y] = w_factor_m_nut;
					}
				}
			}
			if(document.getElementById('WFMS') && document.getElementById('WFMS').checked == true){
				gen_tabelle(WF3);
			}else{
				gen_tabelle(WF1);
			}
			nutungsfaktor_dazu = true;
		}else{
			if(SDa == 0 || SDa =='' || isNaN(SDa)){
				document.getElementById('statorD').value = 0;
				blink('statorD');
			}
			if(bs ==0 || bs=='' || isNaN(bs)){
				document.getElementById('nutB').value = 0;
				blink('nutB');
			}
			document.getElementById('WFMN').checked = false;
			if(document.getElementById('WFMS') && document.getElementById('WFMS').checked == true){
				gen_tabelle(WF2);
			}else{
				gen_tabelle(WF);
			}
			nutungsfaktor_dazu = false;
		}
	}else{
		if(document.getElementById('WFMS') && document.getElementById('WFMS').checked == true){
			gen_tabelle(WF2);
		}else{
			gen_tabelle(WF);
		}
		nutungsfaktor_dazu = false;
	}
}

function w_s_factor(){
	if(document.getElementById('WFMS') && document.getElementById('WFMS').checked == true){
		if(document.getElementById('WFMN') && document.getElementById('WFMN').checked == true){
			var alterWF = WF1;
		}else{
			var alterWF = WF;
		}
		
		if(document.getElementById('schraegung')){
			var schraegungE = document.getElementById('schraegung').value;
			schraegungE = schraegungE.replace(/,/,'.');
		}
		if(schraegungE != 0 && schraegungE!='' && !isNaN(schraegungE)){
			for(i=0;i<alterWF.length;i++){
				for(y=0;y<alterWF[i].length;y++){ //sin(z*pi*i/2/N1) / (z*pi*i/2/N1)
					var w_factor_m_S2 = WF[i][y]*(Math.sin(schraegungE*Math.PI*(y+1)/nutenx) / (schraegungE*Math.PI*(y+1)/nutenx));
					w_factor_m_S2 = Math.round(w_factor_m_S2 * 100000) / 100000;
					WF2[i][y] = w_factor_m_S2;
					if(document.getElementById('WFMN') && document.getElementById('WFMN').checked == true){
						var w_factor_m_S = alterWF[i][y]*(Math.sin(schraegungE*Math.PI*(y+1)/nutenx) / (schraegungE*Math.PI*(y+1)/nutenx));
						w_factor_m_S = Math.round(w_factor_m_S * 100000) / 100000;
						WF3[i][y] = w_factor_m_S;
					}
				}
			}
			if(document.getElementById('WFMN') && document.getElementById('WFMN').checked == true){
				gen_tabelle(WF3);
			}else{
				gen_tabelle(WF2);
			}
			schraegung_dazu=true;
		}else{
			document.getElementById('schraegung').value = 0;
			document.getElementById('WFMS').checked = false;
			blink('schraegung');
			if(document.getElementById('WFMN') && document.getElementById('WFMN').checked == true){
				gen_tabelle(WF1);
			}else{
				gen_tabelle(WF);
			}
			schraegung_dazu=false;
		}
	}else{
		if(document.getElementById('WFMN') && document.getElementById('WFMN').checked == true){
			gen_tabelle(WF1);
		}else{
			gen_tabelle(WF);
		}
		schraegung_dazu=false;
		
	}
}








//die einzelnen schritte
function schritt_fur_schritt(){
	drawStator(nutenx,schemay,act_schritt,schaltx);
	var schritt_div = document.getElementById('steps');
	if(document.getElementById('s_'+act_schritt)){	
		document.getElementById('s_'+act_schritt).style.backgroundColor="#333";
	}
	if(document.getElementById('s_'+(act_schritt+1))){
		document.getElementById('s_'+(act_schritt+1)).style.backgroundColor="";
	}
	schritt_div.innerHTML = '<span onclick="if(act_schritt!=1){act_schritt = act_schritt-1;schritt_fur_schritt();};return false;">&lt;-'+lang['schritt_zurueck_'+selected_lang]+'</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span onclick="if(act_schritt < schemay.length){act_schritt = act_schritt+1;schritt_fur_schritt();};return false;">'+lang['schritt_vor_'+selected_lang]+'-&gt;</span>';
	
	
}

function farbe_zu (buchstabe) {
	var farbe = '#00CA00';
	buchstabe = buchstabe.toLowerCase();
	if(buchstabe == '|'){farbe = '#000000';}
	if(buchstabe == '/'){farbe = '#000000';}
	if(buchstabe == '-'){farbe = '#000000';}
	if(buchstabe == 'a'){farbe = '#EA0000';}
	if(buchstabe == 'b'){farbe = '#008AE6';}
	if(buchstabe == 'c'){farbe = '#00CA00';}
	return farbe;
}



//Stator und bewicklung via canvas
function drawStator(nuten,schema,schritt,Y_D){
	var xzx = schema.split('/').length-1
	!schritt ? schritt = nuten+1+xzx:0;
	
	if(schema[schritt-1] == '/'){
	      schritt = schritt -1;
	}
	
	
	//Canvas Element ertellen und anpassen
	var canvas_container = document.getElementById('canvas_container');
	
	if(document.getElementById("statorCanvas")){
		canvas_container.removeChild(document.getElementById("statorCanvas"));
	}
	
	var statorCanvas = document.createElement('canvas');
	statorCanvas.id="statorCanvas";
	statorCanvas.height = "700";
	statorCanvas.width = "700";
	statorCanvas.innerHTML = lang['kein_html5_'+selected_lang];
	canvas_container.appendChild(statorCanvas);

	var stator = statorCanvas.getContext('2d');
	
	//Grundlegende hammer Maße
	var hammerHeight = 255;
	var hammerWidth = 950;
	hammerWidth = hammerWidth/nuten
	hammerHeight = hammerHeight - (nuten/3);
	if(nuten ==6){
		hammerWidth = hammerWidth+3;	
	}else if(nuten ==3){
		hammerWidth = hammerWidth-80;
	}
	
	//Innerer Kreis des Stators
	stator.fillStyle = "rgb(186,186,186)";
	stator.beginPath();
	stator.arc(350,350,148,0,Math.PI*2,true);
	stator.closePath();
	stator.fill();

	stator.fillStyle = "#FFF";
	stator.beginPath();
	stator.arc(350,350,112,0,Math.PI*2,true);
	stator.closePath();
	stator.fill();

	
	// höhe der verschaltung
	var s_basis = 100;
	
	if(nuten > 21 && nuten <= 36){
		s_basis = s_basis + (nuten/3.8);
	}
	
	// ebenen der verschaltung
	var ebene = Array();
	ebene['a1'] = 40+s_basis;
	ebene['a2'] = 35+s_basis;
	ebene['b1'] = 30+s_basis;
	ebene['b2'] = 25+s_basis;
	ebene['c1'] = 20+s_basis;
	ebene['c2'] = 15+s_basis;
	

	
	stator.translate(350, 350);
	

	//Grade drehen .. hab bei 90 grad angefangen :/
	stator.rotate(270*Math.PI/180);
	//Stator hämmer und drähte malen und drehen
	for(var i=0; i<nuten; i++){
		
		//hämmer
		stator.beginPath();
		stator.moveTo(130,hammerWidth/4);
		stator.lineTo(Math.round(hammerHeight/1.03),hammerWidth/4);
		stator.lineTo(Math.round(hammerHeight/1.025),hammerWidth/2);
		stator.lineTo(hammerHeight,hammerWidth/2);
		stator.lineTo(hammerHeight+hammerWidth/20,0);
		stator.lineTo(hammerHeight,-hammerWidth/2);
		stator.lineTo(Math.round(hammerHeight/1.025),-hammerWidth/2);
		stator.lineTo(Math.round(hammerHeight/1.03),-hammerWidth/4);
		stator.lineTo(130,-hammerWidth/4);
		stator.textBaseline = 'middle';
		
		stator.fillStyle = "rgb(186,186,186)";
		stator.fill();
		//zum nächsten drehen
		stator.rotate(Math.PI/(nuten/2));
	}
	
	stator.fillStyle = "#111";

	pole_dazu();
	var Swikel = schema.substr(0,schritt).split('/');
	
	//wenn schritte dann immer letzte spule oben
	if(schritt){
		stator.rotate(-(schritt-1-(Swikel.length-1))*Math.PI/(nuten/2));
	}
	var Sschemen = schema.split('/');
	var schemen = Array();
	for(i=0;i<Swikel.length;i++){
		schemen[i] = Sschemen[i];
	}
	var gesamtlength = -1;
	for(zx=0;zx<schemen.length;zx++){
		schema = schemen[zx];

		//Anfäng und enden merken
		var f_u = Array(); 
		f_u['a'] = false;
		f_u['b']  = false;
		f_u['c']  = false;
		
		//Verlauf der ebenen
		ebenen_verlauf = Array();
		ebenen_verlauf['a1'] = false;
		ebenen_verlauf['a2'] = false;
		ebenen_verlauf['b1'] = false;
		ebenen_verlauf['b2'] = false;
		ebenen_verlauf['c1'] = false;
		ebenen_verlauf['c2'] = false;

		// Y und D kramz
		var enden = Array();
		enden[0] = 0;
		enden[3] ='abc';
		var das_nicht = false;
		var erstefarbe = false;

		
		for(var i=0; i<schema.length; i++){
			gesamtlength = gesamtlength+1;
			if((gesamtlength+1+zx) <= schritt){
				// Bewicklung und verschaltung
				var wire_color = farbe_zu (schema[i]);
				
				var richtung = 15;
				if(schema[i].toLowerCase() == schema[i]){
					richtung = -15;
				}
				var abc = 'abc';
			
				// Bewicklung
				var schon_beschriftet = false;
				for(var y=0; y<75; y=y+15){
					das_nicht = false;
					if(schema[i].toLowerCase() != '-'){
						stator.beginPath();
						//nur bis zum bestimmten schritt bewickeln
					
						if(richtung == 15){
							//Lienie in richtung 1
							stator.moveTo(156+y,(hammerWidth/4)+2);
							stator.lineTo(156+y+richtung, -(hammerWidth/4)-2);
							
							if(y == 0){
								// Anfangs punkt richtung 1
								stator.moveTo(156+y, -(hammerWidth/4)+2);
								stator.lineTo(156+y, -(hammerWidth/4)-2);
								
								if(!f_u[schema[i].toLowerCase()]){
									// wenns die erste spule einer fase in richtung 1 ist anfang malen
									f_u[schema[i].toLowerCase()] = schema.toLowerCase().lastIndexOf(schema[i].toLowerCase());
									stator.moveTo(156+y, -(hammerWidth/4)+2);
									stator.lineTo(156+y, -(hammerWidth/3.5)-5);
									stator.moveTo(154+y, -(hammerWidth/3.5)-5);
									stator.lineTo(300, -(hammerWidth/3.5)-5);
									stator.font =  "16px 'verdana'";
									stator.fillText && nuten != 3 ? stator.fillText(lang['anfang_'+selected_lang]+' '+schema[i].toUpperCase(), 275, 0):0;
									schon_beschriftet = true;
									
									ebenen_verlauf[schema[i].toLowerCase()+'1'] = false;
									ebenen_verlauf[schema[i].toLowerCase()+'2'] = false;
								}else{
									// anfang einer spule in richtung 1 aus verschaltung
									if(ebenen_verlauf[schema[i].toLowerCase()+'1']){
										var sub_e = '1';
									}else if(ebenen_verlauf[schema[i].toLowerCase()+'2']){
										var sub_e = '2';
									}else{
										var sub_e = '1';
									}
									ebenen_verlauf[schema[i].toLowerCase()+sub_e] = true;
									stator.moveTo(156+y, -(hammerWidth/4.3)-2);
									stator.lineTo(ebene[schema[i].toLowerCase()+sub_e]-(18/nuten), -(hammerWidth/4.3)-2);

									//ende spule oben links
									stator.arc(0,0,ebene[schema[i].toLowerCase()+sub_e], (-Math.PI/nuten)+0.001, -Math.PI/nuten, true);

									
								}
							}
							if(y == 60){
								// Ende richtung 1
								stator.moveTo(171+y, (hammerWidth/4)+2);
								stator.lineTo(171+y, (hammerWidth/4)-2);

								if(i == f_u[schema[i].toLowerCase()]){
									// wenns die lätzte spule einer fase in richtung 1 ist ende malen
									if(!Y_D){
										stator.moveTo(171+y, (hammerWidth/4)-2);
										stator.lineTo(300, (hammerWidth/4)-2);
										stator.font =  "16px 'verdana'";
										stator.fillText && !schon_beschriftet ? stator.fillText(lang['ende_'+selected_lang]+' '+schema[i].toUpperCase(), 275, 0):0;
									}else if(Y_D == 'Y'){
										das_nicht = true;
										stator.moveTo(171+y, (hammerWidth/4.5)-2);
										stator.lineTo(171+y, (hammerWidth/4)+5);
									
										stator.moveTo(171+y, (hammerWidth/4)+5);
										stator.lineTo(148, (hammerWidth/4)+5);
										enden[1] = schema[i].toLowerCase();
										switch(enden[0]){
											case(0):
												enden[0] = 1; 
												stator.arc(0,0,100,Math.PI/nuten, (Math.PI/nuten)+0.001, false); 
												erstefarbe = schema[i].toLowerCase();
											break;
											case(1):
												stator.lineTo(100, 0);
												enden[0] = 2; 
												das_nicht = 'mitte';
												stator.moveTo(100, 0);
												stator.lineTo(90, 0);
											break;
											case(2):
												enden[0] = 3; 
												stator.arc(0,0,100,(-Math.PI/nuten)+0.001, -Math.PI/nuten, true); 
											break;
										}	
									}
				
									ebenen_verlauf[schema[i].toLowerCase()+'1'] = false;
									ebenen_verlauf[schema[i].toLowerCase()+'2'] = false;
								}else{
									
									// ende einer spule in richtung 1 zu verschaltung
									if(!ebenen_verlauf[schema[i].toLowerCase()+'1']){
										var sub_e = '1';
										ebenen_verlauf[schema[i].toLowerCase()+'2'] = false;
									}else if(!ebenen_verlauf[schema[i].toLowerCase()+'2']){
										var sub_e = '2';
										ebenen_verlauf[schema[i].toLowerCase()+'1'] = false;
									}
									ebenen_verlauf[schema[i].toLowerCase()+sub_e] = true;
									// ende einer spule rechts
									stator.moveTo(171+y, (hammerWidth/4.5)-2);
									stator.lineTo(171+y, (hammerWidth/4)+5);
									
									stator.moveTo(171+y, (hammerWidth/4)+5);
									stator.lineTo(ebene[schema[i].toLowerCase()+sub_e]-(18/nuten), (hammerWidth/4)+5);
					
									//ende spule oben rechts
									stator.arc(0,0,ebene[schema[i].toLowerCase()+sub_e], Math.PI/nuten, (Math.PI/nuten)+0.001, false);
								}
							}

						}else{
							//Lienie in richtung 2
							stator.moveTo(171+y,(hammerWidth/4)+2);
							stator.lineTo(171+y+richtung, -(hammerWidth/4)-2);

							if(y == 0){
								// Anfangs punkt richtung 2
								stator.moveTo(156+y, (hammerWidth/4)+2);
								stator.lineTo(156+y, (hammerWidth/4)-2);
								if(!f_u[schema[i].toLowerCase()]){
									// wenns die erste spule einer fase in richtung 2 ist anfang malen
									f_u[schema[i].toLowerCase()] = schema.toLowerCase().lastIndexOf(schema[i].toLowerCase());
									stator.moveTo(156+y, (hammerWidth/4)+2);
									stator.lineTo(156+y, (hammerWidth/3.5)+5);
									stator.moveTo(154+y, (hammerWidth/3.5)+5);
									stator.lineTo(300, (hammerWidth/3.5)+5);
									stator.font =  "16px 'verdana'";
									stator.fillText && nuten != 3 ? stator.fillText(lang['anfang_'+selected_lang]+' '+schema[i].toUpperCase(), 275, 0):0;
									schon_beschriftet = true;

									ebenen_verlauf[schema[i].toLowerCase()+'1'] = false;
									ebenen_verlauf[schema[i].toLowerCase()+'2'] = false;
								}else{
									// anfang einer spule in richtung 2 aus verschaltung
									if(ebenen_verlauf[schema[i].toLowerCase()+'1']){
										var sub_e = '1';
									}else if(ebenen_verlauf[schema[i].toLowerCase()+'2']){
										var sub_e = '2';
									}else{
										var sub_e = '1';
									}
									ebenen_verlauf[schema[i].toLowerCase()+sub_e] = true;
									stator.moveTo(156+y, (hammerWidth/4.5)+3);
									stator.lineTo(ebene[schema[i].toLowerCase()+sub_e]-(18/nuten), (hammerWidth/4.5)+2);
									
									stator.lineTo(ebene[schema[i].toLowerCase()+sub_e],0);
									stator.arc(0,0,ebene[schema[i].toLowerCase()+sub_e],0, -Math.PI/nuten, true);
									
								}
							}
							if(y == 60){
								// Ende richtung 2
								stator.moveTo(171+y, -(hammerWidth/4)+2);
								stator.lineTo(171+y, -(hammerWidth/4)-2);

								if(i == f_u[schema[i].toLowerCase()]){
									// wenns die lätzte spule einer fase in richtung 2 ist ende malen
									if(!Y_D){
										stator.moveTo(171+y, -(hammerWidth/4));
										stator.lineTo(300, -(hammerWidth/4));
										stator.font =  "16px 'verdana'";
										stator.fillText && !schon_beschriftet ? stator.fillText(lang['ende_'+selected_lang]+' '+schema[i].toUpperCase(), 275, 0):0;
									}else if(Y_D == 'Y'){
										das_nicht = true;
										stator.moveTo(171+y, -(hammerWidth/4.5)+2);
										stator.lineTo(171+y, -(hammerWidth/4)-5);

										stator.moveTo(171+y, -(hammerWidth/4)-5);
										stator.lineTo(148, -(hammerWidth/4)-5);
										enden[1] = schema[i].toLowerCase();
										switch(enden[0]){
											case(0):
												enden[0] = 1; 
												stator.arc(0,0,100,Math.PI/nuten, (Math.PI/nuten)+0.001, false); 
												erstefarbe = schema[i].toLowerCase();
											break;
											case(1):
												stator.lineTo(100, 0);
												enden[0] = 2; 
												das_nicht = 'mitte';
												stator.moveTo(100, 0);
												stator.lineTo(90, 0);
											break;
											case(2):
												enden[0] = 3; 
												stator.arc(0,0,100,(-Math.PI/nuten)+0.001, -Math.PI/nuten, true); 
											break;
										}								
									}

									ebenen_verlauf[schema[i].toLowerCase()+'1'] = false;
									ebenen_verlauf[schema[i].toLowerCase()+'2'] = false;
								}else{
									// ende einer spule in richtung 1 zu verschaltung
									if(!ebenen_verlauf[schema[i].toLowerCase()+'1']){
										var sub_e = '1';
										ebenen_verlauf[schema[i].toLowerCase()+'2'] = false;
									}else if(!ebenen_verlauf[schema[i].toLowerCase()+'2']){
										var sub_e = '2';
										ebenen_verlauf[schema[i].toLowerCase()+'1'] = false;
									}
									
									ebenen_verlauf[schema[i].toLowerCase()+sub_e] = true;
									stator.moveTo(171+y, -(hammerWidth/4.5)+2);
									stator.lineTo(171+y, -(hammerWidth/4)-5);

									stator.moveTo(171+y, -(hammerWidth/4)-5);
									stator.lineTo(ebene[schema[i].toLowerCase()+sub_e]-(18/nuten), -(hammerWidth/4)-5);

									stator.moveTo(ebene[schema[i].toLowerCase()+sub_e]-(18/nuten), -(hammerWidth/4)-5);
									
									stator.lineTo(ebene[schema[i].toLowerCase()+sub_e], 0);
									stator.arc(0,0,ebene[schema[i].toLowerCase()+sub_e],0, (Math.PI/nuten)+0.001, false);
									
								}
							}
						}
						

						
						stator.strokeStyle = wire_color;
						
						
						stator.lineWidth=4; 
						if(nuten > 42){
							stator.lineWidth=2;  
						}
						if(nuten > 24 && nuten <= 42){
							stator.lineWidth=3;  
						}
						
						stator.stroke();
					}
				}
				
				//sternpunkt
				if(!das_nicht || das_nicht == 'mitte'){
					if(das_nicht != 'mitte'){
						stator.beginPath();
						switch(enden[0]){
							case(1):
								stator.arc(0,0,100,-Math.PI/nuten, Math.PI/nuten, false); 
								stator.strokeStyle = farbe_zu(enden[1]);
							break;
							case(2):
								stator.arc(0,0,100,Math.PI/nuten, -Math.PI/nuten, true); 
								stator.strokeStyle = farbe_zu(enden[3]);
							break;
						}
						stator.stroke();
						enden[3] = enden[3].replace(enden[1],'');
					}else{
						stator.beginPath();
						stator.arc(0,0,100,-Math.PI/nuten, 0, false);
						stator.moveTo(100, -4);
						stator.lineTo(90, -4);					
						stator.strokeStyle = farbe_zu(erstefarbe);
						stator.stroke();
						
						stator.beginPath();
						stator.arc(0,0,100,Math.PI/nuten, 0, true); 
						stator.moveTo(100, 4);
						stator.lineTo(90, 4);		
						var farbe2 = abc.replace(erstefarbe,'').replace(enden[1],'');
						stator.strokeStyle = farbe_zu(farbe2);
						stator.stroke();
						enden[3] = enden[3].replace(enden[1],'');
					}

				}else{
					
				}
					
				// Linien auf dem weg zur nächsten spule weiterführen
				for(z=1;z<3;z++){
					for(x=0; x< abc.length; x++){
						if(ebenen_verlauf[abc[x]+z] && abc[x] != schema[i].toLowerCase()){
								
							stator.beginPath();
								
							stator.arc(0,0,ebene[abc[x]+z], Math.PI/nuten, -Math.PI/nuten, true);
							stator.strokeStyle = farbe_zu(abc[x]);	
							stator.stroke();
						}
					}
				}
					
				//hämmer nummerieren
				stator.font =  "12px 'verdana'";
				if(nuten <= 6){
					stator.fillText ? stator.fillText(i+1, hammerHeight+14, 0):0;
				}else{
					stator.fillText ? stator.fillText(i+1, hammerHeight+7, 0):0;
				}
				
			//zum nächsten drehen
			stator.rotate(Math.PI/(nuten/2));
			}
		}
	}
	if(verteilt){
		WicklungV(verteilt,nuten);
	}else{
		if(document.getElementById("statorCanvas2")){
			mainContainer.removeChild(document.getElementById("statorCanvas2"));
		}
	}
}

function WicklungV(verteiltW,nuten){
	var statorCanvas = document.getElementById("statorCanvas");
	var vertW = statorCanvas.getContext('2d');	
	var Nutbelag = verteiltW.split('|');
	var NutCount = Nutbelag.length-1;
	
	vertW.rotate((270*Math.PI/180)-Math.PI/(NutCount/2));
	
	for(y = 0;y<2;y++){
		if(Nutbelag[0][y]){
			vertW.rotate((Math.PI/(NutCount/2))/2);
			for(i = 0;i<nuten;i++){
				vertW.beginPath();
				vertW.lineWidth=4; 
				if(y==0){
					if(Nutbelag[0][1]){
						var radiusx = 170;
					}else{
						var radiusx = 200;
					}
				}else{
					var radiusx = 222;
				}
					
				vertW.arc(0,radiusx,10, 0.001,0, false);
				vertW.strokeStyle = farbe_zu(Nutbelag[i][y].toLowerCase());
				
				vertW.font =  "20px 'verdana'";
				if(Nutbelag[i][y] == Nutbelag[i][y].toLowerCase()){
					vertW.fillText ? vertW.fillText('-', -4, radiusx-2):0;
				}else{
					vertW.fillText ? vertW.fillText('+', -8, radiusx-2):0;
				}
				
				vertW.stroke();		
				vertW.rotate(Math.PI/(NutCount/2));
			}
		vertW.rotate(-(Math.PI/(NutCount/2))/2);
		}
	}
	if(document.getElementById("statorCanvas2")){
		mainContainer.removeChild(document.getElementById("statorCanvas2"));
	}
	if(fehlerV){
		return;
	}
	var xzBelag = verteilt.split('|');
	var schaltCanvas = document.createElement('canvas');
	schaltCanvas.id="statorCanvas2";
	schaltCanvas.height = (50*xzBelag.length-2);
	schaltCanvas.width = "700";
	schaltCanvas.innerHTML = lang['kein_html5_'+selected_lang];
	mainContainer.appendChild(schaltCanvas);

	var Vverschaltung = schaltCanvas.getContext('2d');

	
	var startposTop = 50;
	var startposLeft = 325;
	
	var abstand = (nuten/polex)-verkuerzungValue;
	var schaltbreite = abstand*40;
	if(schaltbreite > 350){
		schaltbreite = 350;
	}
	if(schaltbreite < 100){
		schaltbreite = 100;
	}

	//für einschicht
	var einschichtrichtung = (nuten/polex)/3;
	if(!xzBelag[0][1] && einschichtrichtung%2 == 0 && einschichtrichtung != 1){
		abstand = abstand - (einschichtrichtung/2); 
	}
	var EinCount = Array();
	EinCount['a'] = 0;
	EinCount['b'] = 0;
	EinCount['c'] = 0;
	
	
	for(i=0;i<xzBelag.length-1;i++){
		
		Vverschaltung.fillStyle = "rgb(0, 0, 0)";
		Vverschaltung.fillRect(startposLeft,startposTop, 50, 25);
		Vverschaltung.fillStyle = "rgb(255, 255, 255)";
		Vverschaltung.font =  "16px 'verdana'";
		if(i>8){
			Vverschaltung.fillText ? Vverschaltung.fillText(i+1, startposLeft+15, startposTop+18):0;
		}else{
			Vverschaltung.fillText ? Vverschaltung.fillText(i+1, startposLeft+20, startposTop+18):0;
		}
		for(z=0;z<2;z++){
			if(xzBelag[i][z]){
				if(z==0){
					if(xzBelag[i][1]){
						var topposV = startposTop-17;
					}else{
						var topposV = startposTop-12;
					}
				}else{
					var topposV = startposTop-8;
				}
				Vverschaltung.lineWidth=3; 
				Vverschaltung.beginPath();
				Vverschaltung.moveTo(startposLeft,topposV);
				Vverschaltung.lineTo(startposLeft+50, topposV);
				if(xzBelag[i][z] != xzBelag[i][z].toLowerCase()){
					Vverschaltung.moveTo(startposLeft+32,topposV-4);
					Vverschaltung.lineTo(startposLeft+38, topposV);
					Vverschaltung.moveTo(startposLeft+32,topposV+4);
					Vverschaltung.lineTo(startposLeft+38, topposV);
				}else{
					Vverschaltung.moveTo(startposLeft+18,topposV-4);
					Vverschaltung.lineTo(startposLeft+12, topposV);
					Vverschaltung.moveTo(startposLeft+18,topposV+4);
					Vverschaltung.lineTo(startposLeft+12, topposV);				
				}
				if(xzBelag[i][1]){
					if(z==0){
						Vverschaltung.moveTo(startposLeft+50, topposV);
						Vverschaltung.lineTo(startposLeft+schaltbreite, topposV -(((abstand*50)-9)/2));
						
						Vverschaltung.moveTo(startposLeft, topposV);						
						Vverschaltung.lineTo(startposLeft-schaltbreite+50, topposV -(((abstand*50)-9)/2));
					}else{
						Vverschaltung.moveTo(startposLeft+50, topposV);
						Vverschaltung.lineTo(startposLeft+schaltbreite, topposV +(((abstand*50)-9)/2));
						
						Vverschaltung.moveTo(startposLeft, topposV);
						Vverschaltung.lineTo(startposLeft-schaltbreite+50, topposV +(((abstand*50)-9)/2));

					}
				}else{
					if(einschichtrichtung%2 == 0 && einschichtrichtung != 1){
						if(EinCount[xzBelag[i][z].toLowerCase()] >= einschichtrichtung/2){
							Vverschaltung.moveTo(startposLeft+50, topposV);
							Vverschaltung.lineTo(startposLeft+schaltbreite, topposV +((abstand*50)/2));
							
							Vverschaltung.moveTo(startposLeft, topposV);
							Vverschaltung.lineTo(startposLeft-schaltbreite+50, topposV +((abstand*50)/2));
						}else{
							Vverschaltung.moveTo(startposLeft+50, topposV);
							Vverschaltung.lineTo(startposLeft+schaltbreite, topposV -((abstand*50)/2));
							
							Vverschaltung.moveTo(startposLeft, topposV);
							Vverschaltung.lineTo(startposLeft-schaltbreite+50, topposV -((abstand*50)/2));
						}
						EinCount[xzBelag[i][z].toLowerCase()]++
						if(EinCount[xzBelag[i][z].toLowerCase()] == einschichtrichtung){
							EinCount[xzBelag[i][z].toLowerCase()] = 0;
						}
					}else{
						if(xzBelag[i][z] != xzBelag[i][z].toLowerCase()){
							Vverschaltung.moveTo(startposLeft+50, topposV);
							Vverschaltung.lineTo(startposLeft+schaltbreite, topposV +((abstand*50)/2));

							Vverschaltung.moveTo(startposLeft, topposV);
							Vverschaltung.lineTo(startposLeft-schaltbreite+50, topposV +((abstand*50)/2));
						}else{
							Vverschaltung.moveTo(startposLeft+50, topposV);
							Vverschaltung.lineTo(startposLeft+schaltbreite, topposV -((abstand*50)/2));
							
							Vverschaltung.moveTo(startposLeft, topposV);
							Vverschaltung.lineTo(startposLeft-schaltbreite+50, topposV -((abstand*50)/2));
						}
					}
				} 

				Vverschaltung.strokeStyle = farbe_zu(xzBelag[i][z].toLowerCase());
				Vverschaltung.stroke();
			}
		}
		startposTop = startposTop+50;
	}
	
}



function pole_dazu(){
	var statorCanvas = document.getElementById("statorCanvas");
	var poleC = statorCanvas.getContext('2d');
	Pcolor1 = "rgba(255,0,0,0.3)";
	Pcolor2 = "rgba(0,0,255,0.3)";
	
	for(var i=0; i<polex; i++){
		//RR
		poleC.beginPath();
		poleC.lineWidth=10; 
		poleC.arc(0,0,301, Math.PI/(polex/2), -Math.PI/(polex/2), true);
		poleC.strokeStyle = "rgba(68,68,68,0.3)";
		poleC.stroke();
		
		//Pole
		poleC.beginPath();
		poleC.lineWidth=18; 
		poleC.arc(0,0,287, (Math.PI/(polex/2)/200)*67, (-Math.PI/(polex/2)/200)*67, true);
		if(i%2!=0){
			poleC.strokeStyle = Pcolor2;
		}else{
			poleC.strokeStyle = Pcolor1;
		}	
		poleC.stroke();
		//zum nächsten drehen
		poleC.rotate(Math.PI/(polex/2));
	}
}


function WF_FFTschnell(schemak,gruppenk,polek,zeit,maxnut){
	var Nutzahl=schemak.length;
	var Fasen = Array();
	Fasen['a'] = Array();
	Fasen['b'] = Array();
	Fasen['c'] = Array();
	Fasen['-'] = Array();
	//U
	Fasen['a'][zeit] = 1*Math.sin(zeit*2*Math.PI);
	//V
	Fasen['b'][zeit] = 1*Math.sin(zeit*2*Math.PI+(2*Math.PI)/3);
	//W
	Fasen['c'][zeit] = 1*Math.sin(zeit*2*Math.PI-(2*Math.PI)/3);
	//0 
	Fasen['-'][zeit] = 0;
	Strombelag = Array();
	for(i=0;i<schemak.length;i++){
		var wert1 = 0;
		var wert2 = 0;
		
		var windungen1 = 0;
		var windungen2 = 0;
			
		wert1 = 1*(Fasen[schemak[i].toLowerCase()][zeit]);
		windungen1 = gruppenk[i];
		if(schemak[i].toLowerCase() == schemak[i]){
			wert1 = -1*(Fasen[schemak[i].toLowerCase()][zeit]);
		}
		wert1 = wert1*windungen1;
		
		if(i==0){
			wert2 = 1*(Fasen[schemak[schemak.length-1].toLowerCase()][zeit]);
			windungen2 = gruppenk[schemak.length-1];
			if(schemak[schemak.length-1].toLowerCase() != schemak[schemak.length-1]){
				wert2 = -1*(Fasen[schemak[schemak.length-1].toLowerCase()][zeit]);
			}
			wert2 = wert2*windungen2;
		}else{
			wert2 = 1*(Fasen[schemak[i-1].toLowerCase()][zeit]);
			windungen2 = gruppenk[i-1];
			if(schemak[i-1].toLowerCase() != schemak[i-1]){
				wert2 = -1*(Fasen[schemak[i-1].toLowerCase()][zeit]);
			}
			wert2 = wert2*windungen2;			
		}
		Strombelag[i] = (wert1+wert2)/maxnut;
	}
	zw = 0;
	for (x=0;x<Nutzahl;x++){
		zw = zw + Strombelag[x] / Nutzahl * Math.sin(polek * Math.PI * x / Nutzahl);
	}
	CK_Re = zw * 2;
	zw = 0;

	for (x=0;x<Nutzahl;x++){
		zw = zw + Strombelag[x] / Nutzahl * Math.cos(polek * Math.PI * x / Nutzahl);
	}
	CK_Im = zw * 2;

	WFausgabe = Math.round(Math.pow(Math.pow(CK_Im,2) + Math.pow(CK_Re,2),0.5)* 100000) / 100000;  //Betrag des Faktors
	return WFausgabe;
}






function WF_FFT(schema,SPS){
	var Nutzahl=schema.length;
	var OWmax = Nutzahl*6;      //Bis zu welcher OW soll ich rechnen (Default: 2*Nutzahl reicht)
	var Fasen = Array();
	
	for(T=0;T<t.length;T++){
		Fasen['a'] = Array();
		Fasen['b'] = Array();
		Fasen['c'] = Array();
		Fasen['-'] = Array();

		
		//U
		Fasen['a'][t[T]] = 1*Math.sin(t[T]*2*Math.PI);
		//V
		Fasen['b'][t[T]] = 1*Math.sin(t[T]*2*Math.PI+(2*Math.PI)/3);
		//W
		Fasen['c'][t[T]] = 1*Math.sin(t[T]*2*Math.PI-(2*Math.PI)/3);
		//0 
		Fasen['-'][t[T]] = 0;

		Strombelag = Array();
		if(!verteilt){
			for(i=0;i<schema.length;i++){
				var wert1 = 0;
				var wert2 = 0;
					
				wert1 = 1*(Fasen[schema[i].toLowerCase()][t[T]]);
				if(schema[i].toLowerCase() == schema[i]){
					wert1 = -1*(Fasen[schema[i].toLowerCase()][t[T]]);
				}
				
				if(i==0){
					wert2 = 1*(Fasen[schema[schema.length-1].toLowerCase()][t[T]]);
					if(schema[schema.length-1].toLowerCase() != schema[schema.length-1]){
						wert2 = -1*(Fasen[schema[schema.length-1].toLowerCase()][t[T]]);
					}
				}else{
					wert2 = 1*(Fasen[schema[i-1].toLowerCase()][t[T]]);
					if(schema[i-1].toLowerCase() != schema[i-1]){
						wert2 = -1*(Fasen[schema[i-1].toLowerCase()][t[T]]);
					}		
				}

				Strombelag[i] = wert1+wert2;
				if(wert1!=0 && wert2!=0){
					Strombelag[i] = (wert1+wert2)/2;
				}
			}
		}else{
			var NutBelag = verteilt.split('|');
			for(i=0;i<(NutBelag.length-1);i++){
				var wert1 = 1*(Fasen[NutBelag[i][0].toLowerCase()][t[T]]);
				if(NutBelag[i][0].toLowerCase() == NutBelag[i][0]){
					wert1 = -1*(Fasen[NutBelag[i][0].toLowerCase()][t[T]]);
				}
				var wert2 = 0;
				if(NutBelag[i][1]){
					wert2 = 1*(Fasen[NutBelag[i][1].toLowerCase()][t[T]]);
					if(NutBelag[i][1].toLowerCase() == NutBelag[i][1]){
						wert2 = -1*(Fasen[NutBelag[i][1].toLowerCase()][t[T]]);
					}
					Strombelag[i] = (wert1+wert2)/2;
				}else{
					Strombelag[i] = wert1;
				}
			}
		}

		WF[T] = Array();

		for(n=0;n<=OWmax;n++){
			zw = 0;
			for (x=0;x<Nutzahl;x++){
				zw = zw + Strombelag[x] / Nutzahl * Math.sin(n * 2 * Math.PI * x / Nutzahl);
			}
			CK_Re = zw * 2;
			zw = 0;

			for (x=0;x<Nutzahl;x++){
				zw = zw + Strombelag[x] / Nutzahl * Math.cos(n * 2 * Math.PI * x / Nutzahl);
			}
			CK_Im = zw * 2;

			WF[T][n-1] = Math.round(Math.pow(Math.pow(CK_Im,2) + Math.pow(CK_Re,2),0.5)* 100000) / 100000;  //Betrag des Faktors
		}
	}
}

function blink(id){
	var inpute = document.getElementById(id);
	inpute.style.backgroundColor="#E7796D";
	setTimeout('document.getElementById("'+id+'").style.backgroundColor="#FFF"',300);
	
}

function clear(){
		if(document.getElementById('Rasten')){
			document.getElementById('Rasten').innerHTML ='';
		}
		if(document.getElementById('steps')){
			document.getElementById('canvas_container').removeChild(document.getElementById("statorCanvas"));
			document.getElementById('steps').innerHTML = '';
		}
		if(document.getElementById("statorCanvas2")){
			mainContainer.removeChild(document.getElementById("statorCanvas2"));
		}
		if(document.getElementById('advanced')){
			document.getElementById('advanced').innerHTML="";
		}
		if(document.getElementById('special')){
			document.getElementById('nutfacktor').innerHTML='';
		}	
	
}








// ============================================================================== Bewicklungsrechner von POWERCROCO.DE ===========================================================================
//	(C) 2004 overclocker_2001 alias oc2k1 & DrM (drmalte@maltemedia.de)
// jedoch leicht verändert ;)

/*
function init(){
	document.Windungsrechner.Nuten.focus();
	document.Windungsrechner.Nuten.value = "";
	document.Windungsrechner.Pole.value = "";
	document.Windungsrechner.Ergebnis.value = "";
}*/

function berechnen() {
	var form = document.Windungsrechner;
	Nuten = eval( form.Nuten.value );
	Pole  = eval( form.Pole.value );
	
	if( Nuten % 3 != 0 || Nuten < 3 ) {
		document.getElementById('Ergebnis').innerHTML = lang['nut_3_teilbar_'+selected_lang];
		document.Windungsrechner.Nuten.focus();
		document.Windungsrechner.Nuten.select();
		blink(document.Windungsrechner.Nuten.id);
		clear();
		return;
	}

	if( Pole % 2 != 0 || Pole < 2 ) {
		document.getElementById('Ergebnis').innerHTML  = lang['pol_grade_'+selected_lang];
		document.Windungsrechner.Pole.focus();
		document.Windungsrechner.Pole.select();
		blink(document.Windungsrechner.Pole.id);
		clear();
		return;
	}
	
	if( Pole == Nuten ) {
		document.getElementById('Ergebnis').innerHTML  = lang['nut_pol_ungleich_'+selected_lang];
		document.Windungsrechner.Pole.focus();
		document.Windungsrechner.Pole.select();
		blink(document.Windungsrechner.Pole.id);
		clear();
		return;
	}
	
	var Lochzahl = Nuten/3/Pole;
	
	if(Lochzahl >= 1 ){
		verteilt=true;
	}else{
		verteilt = false;
	}
	
	Winkel = 180 * Pole / Nuten;
	a = 0; b = 0; c = 0;
	A = 0; B = 0; C = 0;
	m = 0;
	schema = ""
	summe = 0;
	if(!verteilt){
		for( i = 0; i < Nuten; i++ ) {
			if(i%2!=0 && istSPS){
				schema += "-";m++;
			}else{
				if( summe >= 330 || summe <  30 ){schema += "A";A++;}
				if( summe >=  30 && summe <  90 ){schema += "b";b++;}
				if( summe >=  90 && summe < 150 ){schema += "C";C++;}
				if( summe >= 150 && summe < 210 ){schema += "a"; a++;}
				if( summe >= 210 && summe < 270 ){schema += "B";B++;}
				if( summe >= 270 && summe < 330 ){schema += "c"; c++;}
			}
			summe = ( summe + Winkel ) % 360;
		}
	}else{
		
		for( i = 0; i < Nuten;i++) {
			if( summe >= 330 || summe <  30 ){schema += "A";A++;}
			if( summe >=  30 && summe <  90 ){schema += "b";b++;}
			if( summe >=  90 && summe < 150 ){schema += "C";C++;}
			if( summe >= 150 && summe < 210 ){schema += "a"; a++;}
			if( summe >= 210 && summe < 270 ){schema += "B";B++;}
			if( summe >= 270 && summe < 330 ){schema += "c"; c++;}
			schema += "|";
			summe = (summe + Winkel) % 360;
		}
			
	}
		
	vonHand = false;
	if( a == b && a == c && A == B && A == C  && schema.indexOf('a')!=-1 && schema.indexOf('A')!=-1){
		while( schema.charAt(schema.length-1) == 'a' || schema.charAt(schema.length-1) == 'A' ) {
			schema = schema.charAt(schema.length-1) + schema.slice( 0, -1 );
		}
	}
	if( schema.charAt( 0 ) == "a" ) {
		schema = schema.replace( /a/g, 'x' );
		schema = schema.replace( /b/g, 'y' );
		schema = schema.replace( /c/g, 'z' );
		schema = schema.replace( /A/g, 'a' );
		schema = schema.replace( /B/g, 'b' );
		schema = schema.replace( /C/g, 'c' );
		schema = schema.replace( /x/g, 'A' );
		schema = schema.replace( /y/g, 'B' );
		schema = schema.replace( /z/g, 'C' );
	}

	if( schema.search( /[bB]/ ) > schema.search( /[cC]/ ) ) {
		schema = schema.replace( /b/g, 'x' );
		schema = schema.replace( /c/g, 'y' );
		schema = schema.replace( /x/g, 'c' );
		schema = schema.replace( /y/g, 'b' );
		schema = schema.replace( /B/g, 'x' );
		schema = schema.replace( /C/g, 'y' );
		schema = schema.replace( /x/g, 'C' );
		schema = schema.replace( /y/g, 'B' );
	}
	//document.Windungsrechner.Ergebnis.value = schema;
	if(verteilt){
		verteilt = schema;
		var nutcount = schema.split('|');
		schema = "";
		schema_y = "";
		for(i=1;i<nutcount.length;i++){
			schema = schema+"-";
			schema_y = schema;
		}
		schema = schema.replace(/\|/g,'').replace(/a/g,'').replace(/b/g,'').replace(/c/g,'');
		if(verteilt.replace(/a/g,'').length == verteilt.replace(/A/g,'').length && verteilt.replace(/b/g,'').length == verteilt.replace(/B/g,'').length && verteilt.replace(/c/g,'').length == verteilt.replace(/C/g,'').length) {
			if( a != b || a != c || A != B || A != C ){
				Schema_ausgeben(Nuten,Pole,schema,lang['unausgewogen_'+selected_lang],false,schema);
			}else{
				Schema_ausgeben(Nuten,Pole,schema,false,false,schema);
			}
		}else{
			Schema_ausgeben(Nuten,Pole,schema,lang['unausgewogen_'+selected_lang],false,schema);
		}
	}else{
		if( a != b || a != c || A != B || A != C ) {
			Schema_ausgeben(Nuten,Pole,schema,lang['unausgewogen_'+selected_lang],false,schema);
		}else{
			Schema_ausgeben(Nuten,Pole,schema,false,false,schema);
		}
	}

}
