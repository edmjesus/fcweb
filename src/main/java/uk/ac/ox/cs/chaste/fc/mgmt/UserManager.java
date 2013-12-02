/**
 * 
 */
package uk.ac.ox.cs.chaste.fc.mgmt;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Vector;

import de.binfalse.bflog.LOGGER;
import uk.ac.ox.cs.chaste.fc.beans.Notifications;
import uk.ac.ox.cs.chaste.fc.beans.User;


/**
 * @author martin
 *
 */
public class UserManager
{
	public static final String ROLE_ADMIN = "ADMIN";
	public static final String ROLE_GUEST = "GUEST";
	public static final String ROLE_MODELER = "MODELER";
	
	public HashMap<Integer, User> knownUsers;
	private Notifications note;
	private DatabaseConnector db;
	
	public UserManager (DatabaseConnector db, Notifications note)
	{
		this.db = db;
		this.note = note;
		knownUsers = new HashMap<Integer, User> ();
	}
	
	public User getUser (int id)
	{
		if (knownUsers.get (id) != null)
			return knownUsers.get (id);
		

		PreparedStatement st = db.prepareStatement (
			"SELECT * FROM `user` WHERE `id`=?");
    ResultSet rs = null;
		try
		{
			st.setInt (1, id);
			st.execute ();
			rs = st.getResultSet ();
			while (rs != null && rs.next ())
			{
				User u = new User (
					rs.getInt ("id"),
					rs.getString ("givenName"),
					rs.getString ("familyName"),
					rs.getString ("mail"),
					rs.getString ("acronym"),
					rs.getString ("institution"),
					rs.getTimestamp ("created"),
					rs.getString ("role")
					);
				knownUsers.put (u.getId (), u);
			}
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err retrieving files: " + e.getMessage ());
			LOGGER.error ("db problem while retrieving files", e);
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return knownUsers.get (id);
	}
	
	public Vector<User> getUsers ()
	{
		Vector<User> res = new Vector<User> ();
		

		PreparedStatement st = db.prepareStatement (
			"SELECT * FROM `user`");
    ResultSet rs = null;
		try
		{
			st.execute ();
			rs = st.getResultSet ();
			while (rs != null && rs.next ())
			{
				User u = new User (
					rs.getInt ("id"),
					rs.getString ("givenName"),
					rs.getString ("familyName"),
					rs.getString ("mail"),
					rs.getString ("acronym"),
					rs.getString ("institution"),
					rs.getTimestamp ("created"),
					rs.getString ("role")
					);
				res.add (u);
				knownUsers.put (u.getId (), u);
			}
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err retrieving files: " + e.getMessage ());
			LOGGER.error ("db problem while retrieving files", e);
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		
		return res;
	}

	public void updateUserRole (int id, String role)
	{
		PreparedStatement st = db.prepareStatement ("UPDATE `user` SET `role`=? WHERE `id`=?");
    ResultSet rs = null;
		
		try
		{
			st.setString (1, role);
			st.setInt (2, id);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
      {
          throw new SQLException("Creating file failed, no rows affected.");
      }
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err updating user: " + e.getMessage ());
			LOGGER.error ("db problem while updating user", e);
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
	}
	
	public boolean updatePassword (User user, String oldPw, String newPw, String newCookie) throws SQLException
	{
		PreparedStatement st = db.prepareStatement ("UPDATE `user` SET `password`=MD5(?), `cookie`=? WHERE `id`=? AND `password`=MD5(?)");
    ResultSet rs = null;
		
		try
		{
			st.setString (1, newPw);
			st.setString (2, newCookie);
			st.setInt (3, user.getId ());
			st.setString (4, oldPw);
			
			int affectedRows = st.executeUpdate();
      if (affectedRows == 0)
      {
          return false;//throw new SQLException("Update failed. No such user/password combination.");
      }
		}
		catch (SQLException e)
		{
			e.printStackTrace();
			note.addError ("sql err updating password of user: " + e.getMessage ());
			LOGGER.error ("db problem while updating password of user", e);
      return false;
		}
		finally
		{
			db.closeRes (st);
			db.closeRes (rs);
		}
		return true;
	}
}
