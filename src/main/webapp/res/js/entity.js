var versions = new Array ();
var files = new Array ();
var doc;
var basicurl;
var entityType;
var entityId;
var curVersion = null;
var converter = new Showdown.converter();
var filesTable = {};

var visualizers = {};

function parseUrl (href)
{
	var t = href.split ("/");
	for (var i = 0; i < t.length; i++)
	{
		if ("/" + t[i] == contextPath && i + 3 < t.length && t[i+1] == "model")
		{
			basicurl = t.slice (0, i + 4).join ("/") + "/";
			entityType = "model";
			entityId = t[i+3];
			return t.slice (i + 4);
		}
		if ("/" + t[i] == contextPath && i + 3 < t.length && t[i+1] == "protocol")
		{
			basicurl = t.slice (0, i + 4).join ("/") + "/";
			entityType = "protocol";
			entityId = t[i+3];
			return t.slice (i + 4);
		}
		if ("/" + t[i] == contextPath && i + 3 < t.length && t[i+1] == "experiment")
		{
			basicurl = t.slice (0, i + 4).join ("/") + "/";
			entityType = "experiment";
			entityId = t[i+3];
			return t.slice (i + 4);
		}
	}
	return null;
}

function getCurVersionId (url)
{
	if (url.length < 2)
		return null;
	return url[1];
}

function getCurFileId (url)
{
	if (url.length < 4)
		return null;
	return url[3];
}

function getCurPluginName (url)
{
	if (url.length < 5)
		return null;
	return url[4];
}

function updateVisibility (jsonObject, actionIndicator)
{
	actionIndicator.innerHTML = "<img src='"+contextPath+"/res/img/loading2-new.gif' alt='loading' />";
	
	var xmlhttp = null;
    // !IE
    if (window.XMLHttpRequest)
    {
        xmlhttp = new XMLHttpRequest();
    }
    // IE -- microsoft, we really hate you. every single day.
    else if (window.ActiveXObject)
    {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    
    xmlhttp.open ("POST", document.location.href, true);
    xmlhttp.setRequestHeader ("Content-type", "application/json");

    xmlhttp.onreadystatechange = function()
    {
        if(xmlhttp.readyState != 4)
        	return;
        
    	var json = JSON.parse(xmlhttp.responseText);
    	//console.log (json);
    	displayNotifications (json);
    	
        if(xmlhttp.status == 200)
        {
        	if (json.updateVisibility)
        	{
	        	var msg = json.updateVisibility.responseText;
	        	if (json.updateVisibility.response)
	        	{
	        		actionIndicator.innerHTML = "<img src='"+contextPath+"/res/img/check.png' alt='valid' /> " + msg;
	        	}
	        	else
	        		actionIndicator.innerHTML = "<img src='"+contextPath+"/res/img/failed.png' alt='invalid' /> " + msg;
        	}
        }
        else
        {
        	actionIndicator.innerHTML = "<img src='"+contextPath+"/res/img/failed.png' alt='error' /> sorry, serverside error occurred.";
        }
    };
    xmlhttp.send (JSON.stringify (jsonObject));
}

function deleteEntity (jsonObject)
{
	var xmlhttp = null;
    // !IE
    if (window.XMLHttpRequest)
    {
        xmlhttp = new XMLHttpRequest();
    }
    // IE -- microsoft, we really hate you. every single day.
    else if (window.ActiveXObject)
    {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    
    xmlhttp.open ("POST", document.location.href, true);
    xmlhttp.setRequestHeader ("Content-type", "application/json");

    xmlhttp.onreadystatechange = function()
    {
        if(xmlhttp.readyState != 4)
        	return;
        
    	var json = JSON.parse(xmlhttp.responseText);
    	displayNotifications (json);
    	
        if (xmlhttp.status == 200)
        {
            var resp = json.deleteVersion || json.deleteEntity;
            if (resp)
            {
                var msg = resp.responseText;
                if (resp.response)
                {
                    addNotification(msg, "info");
                    doc.entity.details.style.display = "none";
                    doc.entity.version.style.display = "none";
                    $(".suppl").hide();
                }
                else
                    alert(msg);
            }
        }
        else
        {
        	alert("sorry, serverside error occurred.");
        }
    };
    xmlhttp.send (JSON.stringify (jsonObject));
}


function highlightPlots (version, showDefault)
{
	//console.log (plotDescription);
	// Plot description has fields: Plot title,File name,Data file name,Line style,First variable id,Optional second variable id,Optional key variable id
	// Output contents has fields: Variable id,Variable name,Units,Number of dimensions,File name,Type,Dimensions
	var plotDescription = version.plotDescription;
	var outputContents = version.outputContents;
	var plots = new Array ();
	for (var i = 1; i < plotDescription.length; i++)
	{
		if (plotDescription[i].length < 2)
			continue;
		//console.log (plotDescription[i][2]);
		var row = document.getElementById ("filerow-" + plotDescription[i][2].hashCode ());
        // Show the first plot defined by the protocol using flot, if there is one available
		if (row && showDefault)
		{
			var viz = document.getElementById ("filerow-" + plotDescription[i][2] + "-viz-displayPlotFlot");
			if (viz)
			{
			    showDefault = false;
				nextPage(viz.href, true); // 'Invisible' redirect
			}
		}

		//console.log ("files: ")
		//console.log (version.files);
		for (var f = 0; f < version.files.length; f++)
		{
			if (files[version.files[f]].name == plotDescription[i][2])
			{
				// Find the plot x and y object names and units from the output contents file.
				for (var output_idx = 0; output_idx < outputContents.length; output_idx++)
				{
					if (plotDescription[i][4] == outputContents[output_idx][0])
					{
						files[version.files[f]].xAxes = outputContents[output_idx][1] + ' (' + outputContents[output_idx][2] + ')';
						files[version.files[f]].xUnits = outputContents[output_idx][2];
					}
					if (plotDescription[i][5] == outputContents[output_idx][0])
					{
						files[version.files[f]].yAxes = outputContents[output_idx][1] + ' (' + outputContents[output_idx][2] + ')';
						files[version.files[f]].yUnits = outputContents[output_idx][2];
					}
					if (plotDescription[i].length > 6 && plotDescription[i][6] == outputContents[output_idx][0])
					{
						files[version.files[f]].keyId = outputContents[output_idx][0];
						files[version.files[f]].keyName = outputContents[output_idx][1];
						files[version.files[f]].keyUnits = outputContents[output_idx][2];
						for (var fkey=0; fkey < version.files.length; fkey++)
						{
							if (files[version.files[fkey]].name == outputContents[output_idx][4])
							{
								files[version.files[f]].keyFile = files[version.files[fkey]];
							}
						}
					}
				}
				files[version.files[f]].title = plotDescription[i][0];
				files[version.files[f]].linestyle = plotDescription[i][3];
			}
			//console.log ("file: ")
			//console.log (files[version.files[f]]);
		}
		
		plots.push (plotDescription[i][2]);
	}
	sortTable (plots);
	
	// If there were no graphs to show, but we do have an errors.txt file and want to show a default, then show the errors
	if (showDefault && version.errorsLink)
	    nextPage(version.errorsLink, true); // 'Invisible' redirect
}

function parseOutputContents (file, version, showDefault)
{
    version.outputContents = null; // Note that there is one to parse
	var goForIt = {
		getContentsCallback : function (succ)
		{
			if (succ)
			{
			    parseCsvRaw(file);
				version.outputContents = file.csv;
                if (version.plotDescription)
                    highlightPlots (version, showDefault);
			}
		}
	};
	getFileContent (file, goForIt);
	
	return null;
}

function parsePlotDescription (file, version, showDefault)
{
	if (file.plotDescription) // TODO: Always false => remove?
		return converter.makeHtml (file.contents);
	
	version.plotDescription = null; // Note that there is one to parse
	var goForIt = {
		getContentsCallback : function (succ)
		{
			if (succ)
			{
			    parseCsvRaw(file);
				version.plotDescription = file.csv;
				if (version.outputContents)
				    highlightPlots (version, showDefault);
				
			}
		}
	};
	getFileContent (file, goForIt);
	
	return null;
}

function parseReadme (file, version)
{
	if (file.contents)
		return converter.makeHtml (file.contents);
	
	var goForIt = {
			getContentsCallback : function (succ)
			{
				if (succ)
				{
					version.readme = converter.makeHtml (file.contents);
					doc.version.readme.innerHTML = version.readme;
					doc.version.readme.style.display = "block";
				}
			}
	};
	getFileContent (file, goForIt);
	
	return null;
}

function displayVersion (id, showDefault)
{
	var v = versions[id];
	if (!v)
	{
		addNotification ("no such version", "error");
		return;
	}
	//console.log(v);
	var dv = doc.version;
	dv.name.innerHTML = "<small>Version: </small>" + v.name + " ";
	
	// If an experiment, show indication of status, perhaps including a note that we don't expect any results yet!
	if (entityType == 'experiment')
	{
	    if (v.status == 'RUNNING' || v.status == 'QUEUED')
	        dv.exptRunningNote.style.display = "block";
	    else
	        dv.exptRunningNote.style.display = "none";
        dv.exptStatus.innerHTML = "Status: " + v.status + ".";
	}
	
	if (dv.visibility)
	{
	    // Show chooser for changing entity visibility
		dv.visibility = removeListeners (dv.visibility);
		
		document.getElementById("visibility-" + v.visibility).selected=true;
		
		dv.visibility.addEventListener("change", function () {
			/*console.log (v.id);
			console.log (dv.visibility.options[dv.visibility.selectedIndex].value);*/
			updateVisibility ({
		    	task: "updateVisibility",
		    	version: v.id,
		    	visibility: dv.visibility.options[dv.visibility.selectedIndex].value
		    }, dv.visibilityAction);
	    }, true);
	}
	
	if (dv.deleteBtn)
	{
		dv.deleteBtn = removeListeners (dv.deleteBtn);
		
		dv.deleteBtn.addEventListener("click", function () {
			if (confirm("Are you sure to delete this version? (including all files and experiments associated to it)"))
			{
				deleteEntity ({
					task: "deleteVersion",
			    	version: v.id
				});
			}
		});
	}
	
    if (entityType != "experiment" && ROLE.isAllowedToCreateNewExperiment)
    {
        // Specify links to create new experiments using this model/protocol
        $(".runExpts").each(function (){this.href = contextPath + "/batch/" + entityType + "/" + convertForURL (v.name) + "/" + v.id;});
    }
    
	dv.author.innerHTML = v.author;
	dv.time.setAttribute ("datetime", v.created);
	dv.time.innerHTML = beautifyTimeStamp (v.created);
	
	removeChildren (dv.filestable);
	filesTable = {};
	filesTable.table = dv.filestable;
	filesTable.plots = {};
	filesTable.pngeps = {};
	filesTable.otherCSV = {};
	filesTable.defaults = {};
	filesTable.text = {};
	filesTable.other = {};
	filesTable.all = new Array ();

	var tr = document.createElement("tr");
	var td = document.createElement("th");
	td.appendChild(document.createTextNode ("Name"));
	tr.appendChild(td);
	td = document.createElement("th");
	td.appendChild(document.createTextNode ("Type"));
	tr.appendChild(td);
	td = document.createElement("th");
	//td.colSpan = 2;
	td.appendChild(document.createTextNode ("Size"));
	tr.appendChild(td);
	td = document.createElement("th");
	td.appendChild(document.createTextNode ("Actions"));
	tr.appendChild(td);
	dv.filestable.appendChild(tr);
	
	for (var i = 0; i < v.files.length; i++)
	{
		var file = files[v.files[i]];
		tr = document.createElement("tr");
		tr.setAttribute("id", "filerow-" + file.name.hashCode ());
		if (file.masterFile)
			tr.setAttribute("class", "masterFile");
		td = document.createElement("td");
		td.appendChild(document.createTextNode (file.name));
		tr.appendChild(td);
		td = document.createElement("td");
		td.appendChild(document.createTextNode (file.type.replace (/^.*identifiers.org\/combine.specifications\//,"")));
		tr.appendChild(td);
		
		var fsize = humanReadableBytes (file.size).split (" ");
		td = document.createElement("td");
		td.appendChild(document.createTextNode (fsize[0] + " " + fsize[1]));
//		td.setAttribute("class", "right");
		tr.appendChild(td);
//		td = document.createElement("td");
//		td.appendChild(document.createTextNode (fsize[1]));
//		tr.appendChild(td);
		td = document.createElement("td");
		
		if (!v.readme && file.name.toLowerCase () == "readme.md")
			v.readme = parseReadme (file, v);
		
		if (!v.plotDescription && file.name.toLowerCase () == "outputs-default-plots.csv")
			parsePlotDescription (file, v, showDefault);
		
		if (!v.outputContents && file.name.toLowerCase () == "outputs-contents.csv")
			parseOutputContents (file, v, showDefault);
		

		filesTable.all.push ({
			name: file.name,
			row: tr
		});
		
		
		
		for (var vi in visualizers)
		{
			var viz = visualizers[vi];
			if (!viz.canRead (file))
				continue;
			var a = document.createElement("a");
			a.setAttribute("id", "filerow-" + file.name + "-viz-" + viz.getName ());
			a.href = basicurl + convertForURL (v.name) + "/" + v.id + "/" + convertForURL (file.name) + "/" + file.id + "/" + vi;
			var img = document.createElement("img");
			img.src = contextPath + "/res/js/visualizers/" + vi + "/" + viz.getIcon ();
			img.alt = viz.getDescription ();
			img.title = img.alt;
			a.appendChild(img);
			registerFileDisplayer (a);
			td.appendChild(a);
			td.appendChild(document.createTextNode (" "));
			// Note how to default-display the errors.txt file, if there is one; the actual displaying
			// will be done by highlightPlots if no graphs are available.
			if (vi == "displayContent" && file.name.toLowerCase() == "errors.txt")
			    v.errorsLink = a.href;
		}
		
		
		
		var a = document.createElement("a");
		a.href = file.url;
		img = document.createElement("img");
		img.src = contextPath + "/res/img/document-save-5.png";
		img.alt = "download document";
		img.title = "download document";
		a.appendChild(img);
		td.appendChild(a);
		tr.appendChild(td);
		dv.filestable.appendChild(tr);
		dv.archivelink.href = contextPath + "/download/" + entityType.charAt(0) + "/" + convertForURL (v.name) + "/" + v.id + "/a/archive";
		
	}
		
		

	if (v.experiments.length > 0)
	{
		removeChildren (dv.experimentpartners);
		
		var compares = new Array();
		var compareType = "";
		
		var ul = document.createElement ("ul");
		for (var i = 0; i < v.experiments.length; i++)
		{
			
			var li = document.createElement ("li");
			var chk = document.createElement ("input");
			chk.type = "checkbox";
			chk.value = v.experiments[i].id;
			compares.push (chk);
			var a = document.createElement ("a");
			if (entityType == "protocol")
			{
			    compareType = "model";
				//console.log ("protoc");
				//console.log (v.experiments[i].model);
				a.appendChild(document.createTextNode(v.experiments[i].model.name + " @ " + v.experiments[i].model.version));
			}
			else
			{
			    compareType = "protocol";
				a.appendChild(document.createTextNode(v.experiments[i].protocol.name + " @ " + v.experiments[i].protocol.version));
			}
			a.href = contextPath + "/experiment/" + v.experiments[i].model.id + v.experiments[i].protocol.id + "/" + v.experiments[i].id + "/latest";
			li.appendChild (chk);
			li.appendChild (a);
			ul.appendChild (li);
		}

		dv.experimentSelAll = removeListeners (dv.experimentSelAll);
		dv.experimentSelNone = removeListeners (dv.experimentSelNone);
		dv.experimentcompare = removeListeners (dv.experimentcompare);
		
		dv.experimentSelAll.addEventListener("click", function () {
			for (var i = 0; i < compares.length; i++)
				compares[i].checked = true;
		});
		dv.experimentSelNone.addEventListener("click", function () {
			for (var i = 0; i < compares.length; i++)
				compares[i].checked = false;
		});
		dv.experimentcompare.addEventListener("click", function () {
			var url = "";
			for (var i = 0; i < compares.length; i++)
				if (compares[i].checked)
					url += compares[i].value + "/";
			if (url)
			    document.location = contextPath + "/compare/e/" + url;
			else
			    window.alert("You need to select some " + compareType + "s to compare.");
		});
		
		if (dv.compareAll)
		{
			dv.compareAll = removeListeners(dv.compareAll);
			if (compares.length > 0)
			{
				dv.compareAll.addEventListener("click", function () {
					var url = "";
					for (var i = 0; i < compares.length; i++)
						url += compares[i].value + "/";
				    document.location = contextPath + "/compare/e/" + url;
				});
				dv.compareAll.style.display = "block";
			}
			else
			{
				dv.compareAll.style.display = "none";
			}
		}
		
		dv.experimentpartners.appendChild (ul);
		//dv.experimentlist.style.display = "block";
		dv.switcher.style.display = "block";
		//dv.details.style.display = "none";
	}
	else
	{
		dv.switcher.style.display = "none";
		dv.experimentpartners.style.display = "none";
		dv.details.style.display = "block";
	}
	
	removeChildren (dv.readme);
	if (v.readme)
	{
		dv.readme.innerHTML = v.readme;
        dv.readme.style.display = "block";
	}
	else
	    dv.readme.style.display = "none";
	if (v.plotDescription && v.outputContents)
		highlightPlots (v, showDefault);
	
	
	doc.entity.details.style.display = "none";
	doc.entity.version.style.display = "block";

	doc.version.files.style.display = "block";
	$("#experiment-files-switcher-files").addClass("selected");
	$("#experiment-files-switcher-exp").removeClass("selected");
	//doc.version.filedetails.style.display = "none";
	// update address bar
	
}

function registerFileDisplayer (elem)
{
	elem.addEventListener("click", function (ev) {
		if (ev.which == 1)
		{
			ev.preventDefault();
			nextPage (elem.href);
		}
    	}, true);
}

function registerVersionDisplayer (elem)
{
	elem.addEventListener("click", function (ev) {
		if (ev.which == 1)
		{
			ev.preventDefault();
			nextPage (elem.href);
		}
    	}, true);
}

function updateVersion (rv)
{
	var v = versions[rv.id];
	if (!v)
	{
		v = new Array ();
		versions[rv.id] = v;
	}
	
	v.name = rv.version;
	v.author = rv.author;
	v.created = rv.created;
	v.visibility = rv.visibility;
	v.id = rv.id;
	v.status = rv.status;
	v.readme = null;
	v.files = new Array ();
	if (rv.files)
    {
	    for (var i = 0; i < rv.files.length; i++)
	    {
	        updateFile (rv.files[i], v);
	        v.files.push (rv.files[i].id);
	    }
    }
	v.experiments = new Array ();
	if (rv.experiments)
		for (var i = 0; i < rv.experiments.length; i++)
		{
			v.experiments.push ({
				model: rv.experiments[i].model,
				protocol: rv.experiments[i].protocol,
				id: rv.experiments[i].id
			});
		}
	versions[v.id] = v;
}

function getFileContent (file, succ)
{
	// TODO: loading indicator.. so the user knows that we are doing something
    
	var xmlhttp = null;
    // !IE
    if (window.XMLHttpRequest)
    {
        xmlhttp = new XMLHttpRequest();
    }
    // IE -- microsoft, we really hate you. every single day.
    else if (window.ActiveXObject)
    {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    
    xmlhttp.open("GET", file.url, true);

    xmlhttp.onreadystatechange = function()
    {
        if(xmlhttp.readyState != 4)
        	return;
    	
        if(xmlhttp.status == 200)
        {
        	file.contents = xmlhttp.responseText;
        	succ.getContentsCallback (true);
        }
        else
        	succ.getContentsCallback (false);
    };
    xmlhttp.send(null);
}

function updateFile (rf, v)
{
	var f = files[rf.id];
	if (!f)
	{
		f = new Array ();
		files[rf.id] = f;
	}
	
	f.id = rf.id;
	f.created = rf.created;
	f.type = rf.filetype;
	f.author = rf.author;
	f.name = rf.name;
	f.masterFile = rf.masterFile;
	f.size = rf.size;
	f.url = contextPath + "/download/" + entityType.charAt(0) + "/" + convertForURL (v.name) + "/" + v.id + "/" + f.id + "/" + convertForURL (f.name);
	f.div = {};
	f.viz = {};
	f.contents = null;
	f.getContents = function (callBack)
	{
		if (!f.contents)
		{
			//console.log ("missing file contents. calling for: " + f.id);
			getFileContent (f, callBack);
		}
		else
			getFileContent (f, callBack);
	};
}

function displayFile (version, id, pluginName)
{
    if (version.plotDescription === null || version.outputContents === null)
    {
        // Try again in 0.1s, by which time hopefully they have been parsed
        console.log("Waiting for metadata to be parsed.");
        window.setTimeout(function(){displayFile(version, id, pluginName)}, 100);
        return;
    }
	var f = files[id];
	if (!f)
	{
		addNotification ("no such file", "error");
		return;
	}
    var df = doc.file;
	df.name.innerHTML = "<small>File: </small>" + f.name;
	df.time.setAttribute ("datetime", f.created);
	df.time.innerHTML = beautifyTimeStamp (f.created);
	df.author.innerHTML = f.author;
	
	if (!f.div[pluginName])
	{
		f.div[pluginName] = document.createElement("div");
		f.viz[pluginName] = visualizers[pluginName].setUp (f, f.div[pluginName]);
	}
    removeChildren (df.display);
	df.display.appendChild (f.div[pluginName]);
    f.viz[pluginName].show ();
	
    // Show parent div of the file display, and scroll there
	doc.version.filedetails.style.display = "block";
	var pos = getPos (doc.version.filedetails);
	window.scrollTo(pos.xPos, pos.yPos);
}

function requestInformation (jsonObject, onSuccess)
{
	// TODO: loading indicator.. so the user knows that we are doing something
    
	var xmlhttp = null;
    // !IE
    if (window.XMLHttpRequest)
    {
        xmlhttp = new XMLHttpRequest();
    }
    // IE -- microsoft, we really hate you. every single day.
    else if (window.ActiveXObject)
    {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    
    xmlhttp.open("POST", document.location.href, true);
    xmlhttp.setRequestHeader("Content-type", "application/json");

    xmlhttp.onreadystatechange = function()
    {
        if(xmlhttp.readyState != 4)
        	return;
        
        //console.log (xmlhttp.responseText);
    	var json = JSON.parse(xmlhttp.responseText);
    	//console.log (json);
    	displayNotifications (json);
    	
        if(xmlhttp.status == 200)
        {
        	
        	if (json.version)
        	{
        		var rv = json.version;
        		
        		updateVersion (rv);
        		onSuccess ();
        	}
        }
    };
    xmlhttp.send(JSON.stringify(jsonObject));
}

/*
 * Note that if the 'replace' argument is not supplied, it in effect defaults to false
 */
function nextPage (url, replace)
{
    if (replace)
        window.history.replaceState(document.location.href, "", url);
    else
        window.history.pushState(document.location.href, "", url);

    render ();
}

function render ()
{
	var url = parseUrl (document.location.href);
	var curVersionId = getCurVersionId (url);
	
	//console.log ("curVersionId " + curVersionId);
	if (curVersionId)
	{
		var curFileId = getCurFileId (url);
		var pluginName = getCurPluginName (url);

		//console.log ("curFileId  " + curFileId);
		//console.log ("pluginName " + pluginName);
		
		var v = versions[curVersionId];
		if (!v)
		{
			//console.log ("missing version. calling for: " + curVersionId);
			// request info about version only
			requestInformation ({
		    	task: "getInfo",
		    	version: curVersionId
			}, render);
			return;
		}
		else if (v != curVersion)
		{
			displayVersion (curVersionId, !(curFileId && pluginName));
			curVersion = v;
		}
		
		if (curFileId && pluginName)
		{
			displayFile (v, curFileId, pluginName);
			doc.file.close.href = basicurl + convertForURL (v.name) + "/" + v.id + "/";
		}
		else
			doc.version.filedetails.style.display = "none";
			
	}
	else
	{
		if (url.length > 0 && url[0] == "latest")
		{
			// The 'return false' means we only follow the first matching link
			$(".entityversionlink").each(function (){nextPage ($(this).attr('href'), true); return false;});
		}
		doc.entity.version.style.display = "none";
		doc.entity.details.style.display = "block";
		curVersion = null;
	}
}

function initModel ()
{
	
	doc = {
			entity : {
				details : document.getElementById("entitydetails"),
				version : document.getElementById("entityversion"),
				deleteBtn : document.getElementById("deleteEntity")
			},
			version : {
				close : document.getElementById("entityversionclose"),
				name : document.getElementById("entityversionname"),
				time : document.getElementById("entityversiontime"),
				author : document.getElementById("entityversionauthor"),
				details : document.getElementById("entityversiondetails"),
				files : document.getElementById("entityversionfiles"),
				filestable : document.getElementById("entityversionfilestable"),
				readme : document.getElementById("entityversionfilesreadme"),
				archivelink : document.getElementById("downloadArchive"),
				filedetails : document.getElementById("entityversionfiledetails"),
				experimentlist: document.getElementById("entityexperimentlist"),
				experimentpartners: document.getElementById("entityexperimentlistpartners"),
				experimentSelAll: document.getElementById("entityexperimentlistpartnersactall"),
				experimentSelNone: document.getElementById("entityexperimentlistpartnersactnone"),
				experimentcompare: document.getElementById("entityexperimentlistpartnersactcompare"),
				compareAll: document.getElementById("compare-all-models"),
				switcher: document.getElementById("experiment-files-switcher"),
				visibility: document.getElementById("versionVisibility"),
				visibilityAction : document.getElementById("versionVisibilityAction"),
				deleteBtn: document.getElementById("deleteVersion"),
				exptRunningNote: document.getElementById("running-experiment-note"),
				exptStatus: document.getElementById("exptStatus")
			},
			file: {
				close : document.getElementById("entityversionfileclose"),
				name : document.getElementById("entityversionfilename"),
				time : document.getElementById("entityversionfiletime"),
				author : document.getElementById("entityversionfileauthor"),
				display : document.getElementById("entityversionfiledisplay")
			}
	};
	
	window.onpopstate = render;
	render ();
	
	document.getElementById("experiment-files-switcher-exp").addEventListener("click", function (ev) {
	    $("#experiment-files-switcher-exp").addClass("selected");
	    $("#experiment-files-switcher-files").removeClass("selected");
		doc.version.details.style.display = "none";
		doc.version.experimentlist.style.display = "block";
	}, false);
	
	document.getElementById("experiment-files-switcher-files").addEventListener("click", function (ev) {
	    $("#experiment-files-switcher-files").addClass("selected");
        $("#experiment-files-switcher-exp").removeClass("selected");
		doc.version.experimentlist.style.display = "none";
		doc.version.details.style.display = "block";
	}, false);
	
	
	doc.version.close.href = basicurl;
	doc.version.close.addEventListener("click", function (ev) {
		if (ev.which == 1)
		{
			ev.preventDefault();
			curVersion = null;
			doc.entity.version.style.display = "none";
			doc.entity.details.style.display = "block";
			nextPage (doc.version.close.href);
		}
    }, true);
		
	doc.file.close.addEventListener("click", function (ev) {
		if (ev.which == 1)
		{
			ev.preventDefault();
			doc.version.filedetails.style.display = "none";
			doc.version.files.style.display = "block";
			nextPage (doc.file.close.href);
		}
    }, true);

	var list = document.getElementById("entityversionlist");
	if (list)
		sortChildrenByAttribute (list, true, "title");
	
	
	var resubmit = document.getElementById("rerunExperiment");
	var resubmitAction = document.getElementById("rerunExperimentAction");
	if (resubmit && resubmitAction)
	{
		resubmit.addEventListener("click", function (ev) {
			batchProcessing ({
				batchTasks : [{
					experiment : entityId
				}],
				force: true
			},resubmitAction);
		});
	}
	
	// search for special links
	var elems = document.getElementsByTagName('a');
    for (var i = 0; i < elems.length; i++)
    {
    	var classes = ' ' + elems[i].className + ' ';
        if(classes.indexOf(' entityversionlink ') > -1)
        {
        	// links to see the model details
        	//var link = elems[i].href;
        	registerVersionDisplayer (elems[i]);
        	/*elems[i].addEventListener("click", function (ev) {
        		if (ev.which == 1)
        		{
        			ev.preventDefault();
        			// set new url
        			// call action
        			//nextPage (elems[i].href);
        		}
        	}, true);
        	*/
            //elems[i].href = "";
            //console.log ("test");
        }

        if(classes.indexOf(' entityversionfilelink ') > -1)
        {
        	// links to see the file details
        }
        
    }
    

	if (doc.entity.deleteBtn)
	{
		doc.entity.deleteBtn.addEventListener("click", function () {
			if (confirm("Are you sure to delete this entity? (including all versions, files, and experiments associated to it)"))
			{
				deleteEntity ({
					task: "deleteEntity",
			    	entity: entityId
				});
			}
				//console.log ("deleting " + v.id);
			/*else
				console.log ("not deleting " + v.id);*/
		});
	}
	

	$(".deleteVersionLink").click (function () {
		if (confirm("Are you sure to delete this version? (including all files and experiments associated to it)"))
		{
			deleteEntity ({
				task: "deleteVersion",
		    	version: $(this).attr("id").replace("deleteVersion-", "")
			});
		}
	});
    
}

document.addEventListener("DOMContentLoaded", initModel, false);
