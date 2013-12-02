/**
 * 
 */
package uk.ac.ox.cs.chaste.fc.mgmt;

import java.io.File;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.UUID;
import java.util.Vector;

import uk.ac.ox.cs.chaste.fc.beans.ChasteEntityVersion;
import uk.ac.ox.cs.chaste.fc.beans.ChasteFile;
import uk.ac.ox.cs.chaste.fc.beans.Notifications;
import uk.ac.ox.cs.chaste.fc.beans.User;
import de.binfalse.bflog.LOGGER;
import de.unirostock.sems.cbarchive.ArchiveEntry;
import de.unirostock.sems.cbarchive.CombineArchive;
import de.unirostock.sems.cbarchive.CombineFormats;
import de.unirostock.sems.cbarchive.OmexDescription;
import de.unirostock.sems.cbarchive.VCard;


/**
 * @author martin
 *
 * TODO: is current user allowed to see the stuff?
 */
public class ChasteFileManager
{
	private DatabaseConnector db;
	private HashMap<Integer, ChasteFile> knownFiles;
	private Notifications note;
	private UserManager userMgmt;
	
	public ChasteFileManager (DatabaseConnector db, Notifications note, UserManager userMgmt)
	{
		this.userMgmt = userMgmt;
		this.db = db;
		this.note = note;
		knownFiles = new HashMap<Integer, ChasteFile> ();
	}
	
	
	private Vector<ChasteFile> evaluateResult (ResultSet rs) throws SQLException
	{
		Vector<ChasteFile> res = new Vector<ChasteFile> ();
		while (rs != null && rs.next ())
		{
			
			int id = rs.getInt ("fileid");
			
			if (knownFiles.get (id) != null)
				res.add (knownFiles.get (id));
			else
			{
				ChasteFile file = new ChasteFile (
					id,
					rs.getString ("filepath"),
					rs.getTimestamp ("filecreated"),
					//rs.getString ("filevis"),
					rs.getString ("filetype"),
					rs.getLong ("filesize"),
					userMgmt.getUser (rs.getInt ("author"))
					);
				knownFiles.put (id, file);
				res.add (file);
			}
		}
		return res;
		
	}


	public boolean removeFile (int fileId)
	{
		PreparedStatement st = db.prepareStatement ("DELETE FROM `files` WHERE `id`=?");
    ResultSet rs = null;
    boolean ok = false;
		
		try
		{
			st.setInt (1, fileId);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
          throw new SQLException("Removing file failed, no rows affected.");
      ok = true;
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err removing file: " + e.getMessage ());
			LOGGER.error ("db problem while removing file", e);
			ok = false;
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return ok;
	}
	
	public int addFile (String name, String type, User u, long size)
	{
		return addFile (name, type, u.getId (), size);
	}
	
	public int addFile (String name, String type, int user, long size)
	{
		PreparedStatement st = db.prepareStatement ("INSERT INTO `files`(`relpath`, `type`, `author`, `size`) VALUES (?,?,?,?)");
    ResultSet rs = null;
    int id = -1;
		
		try
		{
			st.setString (1, name);
			st.setString (2, type);
			st.setInt (3, user);
			st.setLong (4, size);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
      {
          throw new SQLException("Creating file failed, no rows affected.");
      }

      rs = st.getGeneratedKeys();
      if (rs.next())
      	id = rs.getInt (1);
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err adding file: " + e.getMessage ());
			LOGGER.error ("db problem while adding file", e);
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return id;
	}
	

	public boolean associateFile (int fileId, ChasteEntityVersion entity, ChasteEntityManager entityMgmt)
	{
		PreparedStatement st = db.prepareStatement ("INSERT INTO `"+entityMgmt.getEntityFilesTable ()+"`(`"+entityMgmt.getEntityColumn ()+"`, `file`) VALUES (?,?)");
    ResultSet rs = null;
    boolean ok = false;
		
		try
		{
			st.setInt (1, entity.getId ());
			st.setInt (2, fileId);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
          throw new SQLException("Associating file to "+entityMgmt.getEntityColumn ()+" failed, no rows affected.");
      ok = true;
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err associating file to "+entityMgmt.getEntityColumn ()+": " + e.getMessage ());
			LOGGER.error ("db problem while associating file to "+entityMgmt.getEntityColumn ()+"", e);
			ok = false;
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return ok;
	}
	

	public boolean associateFile (int fileId, int versionId, String tableName, String columnName)
	{
		PreparedStatement st = db.prepareStatement ("INSERT INTO `"+tableName+"`(`"+columnName+"`, `file`) VALUES (?,?)");
    ResultSet rs = null;
    boolean ok = false;
		
		try
		{
			st.setInt (1, versionId);
			st.setInt (2, fileId);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
          throw new SQLException("Associating file to "+columnName+" failed, no rows affected.");
      ok = true;
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err associating file to "+columnName+": " + e.getMessage ());
			LOGGER.error ("db problem while associating file to "+columnName+"", e);
			ok = false;
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return ok;
	}


	/*public boolean associateFileToExperiment (int fileId, int versionId)
	{
		PreparedStatement st = db.prepareStatement ("INSERT INTO `experiment_files`(`experiment`, `file`) VALUES (?,?)");
    ResultSet rs = null;
    boolean ok = false;
		
		try
		{
			st.setInt (1, versionId);
			st.setInt (2, fileId);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
          throw new SQLException("Associating file to experiment failed, no rows affected.");
      ok = true;
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err associating file to experiment: " + e.getMessage ());
			LOGGER.error ("db problem while associating file to experiment", e);
			ok = false;
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return ok;
	}


	public boolean associateFileToProtocol (int fileId, int versionId)
	{
		PreparedStatement st = db.prepareStatement ("INSERT INTO `protocol_files`(`protocol`, `file`) VALUES (?,?)");
    ResultSet rs = null;
    boolean ok = false;
		
		try
		{
			st.setInt (1, versionId);
			st.setInt (2, fileId);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
          throw new SQLException("Associating file to protocol failed, no rows affected.");
      ok = true;
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err associating file to protocol: " + e.getMessage ());
			LOGGER.error ("db problem while associating file to ptotocol", e);
			ok = false;
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return ok;
	}
	
	public boolean associateFileToModel (int fileId, int versionId)
	{
		PreparedStatement st = db.prepareStatement ("INSERT INTO `model_files`(`model`, `file`) VALUES (?,?)");
    ResultSet rs = null;
    boolean ok = false;
		
		try
		{
			st.setInt (1, versionId);
			st.setInt (2, fileId);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
          throw new SQLException("Associating file to model failed, no rows affected.");
      ok = true;
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err associating file to model: " + e.getMessage ());
			LOGGER.error ("db problem while associating file to model", e);
			ok = false;
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return ok;
	}*/


	public boolean getFiles (ChasteEntityVersion vers, String filesTable, String enityColumn)
	{
		int id = vers.getId ();
		ResultSet rs = null;

		PreparedStatement st = db.prepareStatement (
			"SELECT f.id AS fileid, f.relpath AS filepath, f.created AS filecreated, f.type AS filetype, u.id AS author, f.size AS filesize FROM "
			+ "`files` f"
			+ " INNER JOIN `" + filesTable + "` mf on mf.file = f.id"
			+ " INNER JOIN `user` u on f.author = u.id"
			+ " WHERE mf." + enityColumn + "=?"
			+ " ORDER BY f.relpath");
		try
		{
			st.setInt (1, id);
			st.execute ();
			rs = st.getResultSet ();
			Vector<ChasteFile> res = evaluateResult (rs);
			vers.setFiles (res);
			return true;
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err retrieving files: " + e.getMessage ());
			LOGGER.error ("db problem while retrieving files (" + filesTable + " - " + enityColumn + ")", e);
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return false;
	}


	/*public ChasteFile getFileById (int fileId)
	{
		return null;
	}*/


	public static File createArchive (ChasteEntityVersion version, String storageDir) throws Exception
	{
		CombineArchive ca = new CombineArchive ();
		Vector<ChasteFile> files = version.getFiles ();
		
		File basePath = new File (storageDir + Tools.FILESEP + version.getFilePath ());
		String entityPath = storageDir + Tools.FILESEP + version.getFilePath () + Tools.FILESEP;

		System.out.println ("base path will be: " + basePath);
		System.out.println ("entityPath will be: " + entityPath);
		
		for (ChasteFile file : files)
		{
			User u = file.getAuthor ();
			VCard vcard = new VCard (u.getFamilyName (), u.getGivenName (), u.getMail (), u.getInstitution ());
			OmexDescription od = new OmexDescription (vcard, file.getFilecreated ());

			System.out.println ("add: " + file.getName ());
			
			ca.addEntry (basePath, new File (entityPath + file.getName ()), CombineFormats.getFormatIdentifier (file.getFiletype ().toLowerCase ()), od);
		}
		
		File tmpDir = new File (Tools.getTempDir ());
		if (!tmpDir.exists ())
			if (!tmpDir.mkdirs ())
				throw new IOException ("cannot create temp dir for file upload");
		
		File tmpFile = new File (tmpDir.getAbsolutePath () + Tools.FILESEP + UUID.randomUUID().toString());
		while (tmpFile.exists ())
			tmpFile = new File (tmpDir.getAbsolutePath () + Tools.FILESEP + UUID.randomUUID().toString());
		ca.exportArchive (tmpFile);
		
		return tmpFile;
	}
	
}
