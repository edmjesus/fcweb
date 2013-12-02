/**
 * 
 */
package uk.ac.ox.cs.chaste.fc.beans;

import java.sql.Timestamp;
import java.util.Vector;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import uk.ac.ox.cs.chaste.fc.mgmt.ExperimentManager;
import uk.ac.ox.cs.chaste.fc.mgmt.Tools;


/**
 * @author martin
 *
 */
public class ChasteExperimentVersion
extends ChasteEntityVersion
{
	public static final String STATUS_RUNNING = "RUNNING";
	public static final String STATUS_SUCCESS = "SUCCESS";
	public static final String STATUS_FAILED = "FAILED";
	public static final String STATUS_INAPPRORIATE = "INAPPRORIATE";
	
	private Timestamp finished;
	private String status;
	private String returnText;
	
	public ChasteExperimentVersion (ChasteEntity entity, int id,
		User author, String filePath, Timestamp created, int numFiles,
		Timestamp finished, String status, String returnText, String visibility)
	{
		super (entity, id, created.toString (), author, filePath, created, numFiles, visibility);
		this.finished = finished;
		this.status = status;
		this.returnText = returnText;
	}

	
	public Timestamp getFinished ()
	{
		return finished;
	}

	
	public String getStatus ()
	{
		return status;
	}

	
	public String getReturnText ()
	{
		return returnText;
	}
	
	public ChasteExperiment getExperiment ()
	{
		return (ChasteExperiment) getEntity ();
	}
	
	public boolean updateExperiment (ExperimentManager expMgmt, String returnMsg, String status)
	{
		return expMgmt.updateVersion (this, returnMsg, status);
	}
	
	
}
