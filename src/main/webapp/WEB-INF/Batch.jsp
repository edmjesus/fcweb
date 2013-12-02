<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<t:skeleton headerImports="${PageHeader}" notes="${Notifications}" user="${User}" title="${Title}Batch - " contextPath="${contextPath}" newExpModelName="${newExpModelName}" newExpProtocolName="${newExpProtocolName}">
    <h1 id="entityname">Batch for ${entity.name}</h1>
	
	<c:if test="${User.allowedToForceNewExperiment}">
		<input type="checkbox" name="force" id="forceoverwrite" value="force"/> <label for="forceoverwrite">Force overwriting of existing experiments</label><br/>
	</c:if>
	
	
   	<button id="checkAll">check all</button>
   	<button id="uncheckAll">uncheck all</button>
	
    <div id="batchlist">
	   	<c:forEach items="${options}" var="opt" >
	   		<h3>${opt.name}</h3>
	   		<ul>
	    		<c:forEach items="${opt.versions}" var="version" >
		    		<li title="${version.value.version}">
		    			<input type="checkbox" name="${version.value.id}" id="checkbox-${version.value.id}" class="batch-checkbox" value="${version.value.id}"/>
		    			<label for="checkbox-${version.value.id}"><strong>${version.value.version}</strong> by <em>${version.value.author}</em></label><br/>
		    			<span class="suppl"><small>created </small> <time>${version.value.created}</time> <small>containing</small> ${version.value.numFiles} File<c:if test="${version.value.numFiles!=1}">s</c:if>.</span>
		    		</li>
	    		</c:forEach>
	   		</ul>
	   	</c:forEach>
	   	<button id="batchcreator">Create Jobs</button> <span id="batchcreatoraction"></span>
   	</div>
</t:skeleton>

