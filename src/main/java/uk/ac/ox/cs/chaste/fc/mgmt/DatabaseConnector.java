package uk.ac.ox.cs.chaste.fc.mgmt;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import uk.ac.ox.cs.chaste.fc.beans.Notifications;
import de.binfalse.bflog.LOGGER;



public class DatabaseConnector
{
	public static final int DB_VERSION = 3;
	private Connection	connection;
	private Notifications note;
	
	
	public DatabaseConnector (Notifications notifications) throws RuntimeException
	{
		this.note = notifications;
		
		try
		{
			Context initCtx = new InitialContext ();
			Context envCtx = (Context) initCtx.lookup ("java:comp/env");
			DataSource ds = (DataSource) envCtx.lookup ("jdbc/CHASTE");
			
			connection = ds.getConnection ();
		}
		catch (NamingException | SQLException e)
		{
			e.printStackTrace ();
			note.addError ("could not connect to DB: " + e.getMessage ());
			throw new RuntimeException ("Error establishing DB connection");
		}
		
		this.checkUpdate ();
	}
	
	public PreparedStatement prepareStatement (String query)
	{
		try
		{
			return connection.prepareStatement (query, Statement.RETURN_GENERATED_KEYS);
		}
		catch (SQLException e)
		{
			LOGGER.error (e, "SQLException: cannot prepare statement");
			note.addError ("SQLException: cannot prepare statement");
			e.printStackTrace();
		}
		return null;
	}
	
	public void closeConnection ()
	{
		try
		{
			if (connection != null)
			{
				connection.close ();
				connection = null;
			}
		}
		catch (SQLException e)
		{
			e.printStackTrace ();
		}
	}
	
	
	protected void finalize () throws Throwable
	{
		try
		{
			closeConnection ();
		}
		finally
		{
			super.finalize ();
		}
	}
	
	public void closeRes (Statement s)
	{
		if (s == null)
			return;
		try
		{
			s.close ();
		}
		catch (SQLException e)
		{
			LOGGER.error (e, "error closing statement");
			e.printStackTrace();
		}
	}
	
	public void closeRes (ResultSet rs)
	{
		if (rs == null)
			return;
		try
		{
			rs.close ();
		}
		catch (SQLException e)
		{
			LOGGER.error (e, "error closing resultset");
			e.printStackTrace();
		}
	}

	private void checkUpdate ()
	{
		try
		{
			// make sure that the database is present before we're going to inject unnecessary stuff..
			PreparedStatement st = this.prepareStatement ("show tables like 'user';");
			st.execute ();
			ResultSet rs = st.getResultSet ();
			if (!rs.next ())
			{
				LOGGER.error ("couldn't find table `user`. check db settings");
				throw new RuntimeException ("found no database..");
			}
			closeRes (st);
			closeRes (rs);
			
			// check versions
			st = this.prepareStatement ("show tables like 'settings';");
			st.execute ();
			rs = st.getResultSet ();
			if (!rs.next ())
			{
				// this is db version 1.0 -> lets upgrade the database to version
				LOGGER.info ("this is db version 1 -> going to upgrate to 2");
				
				st = this.prepareStatement ("CREATE TABLE IF NOT EXISTS `settings` ("
					+ "  `user` int(11) NOT NULL,"
					+ "  `key` varchar(20) COLLATE utf8_unicode_ci NOT NULL,"
					+ "  `val` varchar(100) COLLATE utf8_unicode_ci NOT NULL,"
					+ "  UNIQUE KEY `user` (`user`,`key`)"
					+ ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;");
				st.execute ();
				closeRes (st);
				
				// inserting first row that is the db version id
				st = this.prepareStatement ("INSERT INTO `settings` (`user`, `key`, `val`) VALUES ('-1', 'DBVERSION', '2');");
				st.execute ();
			}
			closeRes (st);
			closeRes (rs);
			
			// get the version id
			st = this.prepareStatement ("select `val` from `settings` where `key`='DBVERSION' and `user`='-1';");
			st.execute ();
			rs = st.getResultSet ();
			if (!rs.next ())
			{
				LOGGER.error ("couldn't find DBVERSION in settings table.");
				throw new RuntimeException ("settings table seems to be corrupt..");
			}
			String versionStr = rs.getString ("val");
			closeRes (st);
			closeRes (rs);
			int currentVersion = -1;
			try
			{
				currentVersion = Integer.parseInt (versionStr);
			}
			catch (NumberFormatException e)
			{
				LOGGER.error ("version number doesn't seem to be an integer");
				throw new RuntimeException ("failed to parse the current database verions number");
			}

			LOGGER.info ("this db is version ", currentVersion, " -- latest db version is ", DB_VERSION);
			
			// if we're not up-to-date we'll do a step-by-step upgrade of the system
			if (currentVersion < DB_VERSION)
			{
				// prepare for version 3
				if (currentVersion < 3)
				{
					LOGGER.info ("upgrading db to version 3..");
					// do something that is necessary for db version 3

					try
					{
						// update model versions
						st = this.prepareStatement ("ALTER TABLE  `modelversions` ADD  `commitmsg` TEXT NOT NULL");
						st.execute ();
						closeRes (st);
						
						// update protocol versions
						st = this.prepareStatement ("ALTER TABLE  `protocolversions` ADD  `commitmsg` TEXT NOT NULL");
						st.execute ();
						closeRes (st);
						
						// update experiment versions
						st = this.prepareStatement ("ALTER TABLE  `experimentversions` ADD  `commitmsg` TEXT NOT NULL");
						st.execute ();
						closeRes (st);

						st = this.prepareStatement ("UPDATE `settings` SET `val`=3 WHERE `user`='-1' AND `key`='DBVERSION';");
						st.execute ();
						closeRes (st);
					}
					catch (SQLException e)
					{
						LOGGER.error (e, "error upgrading db to version 3");
						throw new RuntimeException ("failed to upgrade database");
					}
				}

				
				
				// prepare for version 99
				if (currentVersion < -99)
				{
					LOGGER.info ("upgrading db to version -99..");
					// do something that is necessary for db version -99
					// ...
					st = this.prepareStatement ("UPDATE `settings` SET `val`=-99 WHERE `user`='-1' AND `key`='DBVERSION';");
					st.execute ();
					closeRes (st);
				}
				
				// and so on..
				LOGGER.info ("successfully upgraded db");
			}
			
			
		}
		catch (Exception e)
		{
			LOGGER.error (e, "error updating database");
			throw new RuntimeException ("checking for database updates failed.. " + e.getMessage ());
		}
	}
}
