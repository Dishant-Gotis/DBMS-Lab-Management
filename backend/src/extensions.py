import os

try:
	import psycopg2
	from psycopg2.extras import RealDictCursor
	_USE_PSYCOPG2 = True
except ModuleNotFoundError:
	import psycopg
	from psycopg.rows import dict_row
	_USE_PSYCOPG2 = False


def get_db_connection():
	database_url = os.getenv("DATABASE_URL")
	if database_url:
		if _USE_PSYCOPG2:
			return psycopg2.connect(database_url)
		return psycopg.connect(database_url)

	db_host = os.getenv("DB_HOST", "localhost")
	db_port = os.getenv("DB_PORT", "5432")
	db_name = os.getenv("DB_NAME")
	db_user = os.getenv("DB_USER")
	db_password = os.getenv("DB_PASSWORD")

	if not all([db_name, db_user, db_password]):
		raise RuntimeError(
			"Database configuration missing. Set DATABASE_URL or DB_NAME/DB_USER/DB_PASSWORD in .env"
		)

	if _USE_PSYCOPG2:
		return psycopg2.connect(
			host=db_host,
			port=db_port,
			dbname=db_name,
			user=db_user,
			password=db_password,
		)

	return psycopg.connect(
		host=db_host,
		port=db_port,
		dbname=db_name,
		user=db_user,
		password=db_password,
	)


def get_dict_cursor(connection):
	if _USE_PSYCOPG2:
		return connection.cursor(cursor_factory=RealDictCursor)
	return connection.cursor(row_factory=dict_row)
