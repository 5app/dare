

CREATE TABLE country (
  id SERIAL,
  code CHAR(2) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE users (
  id SERIAL,
  username varchar(255) NOT NULL,
  first_name varchar(255) DEFAULT NULL,
  last_name varchar(255) DEFAULT NULL,
  secret varchar(2048) DEFAULT NULL,
  country_id INTEGER DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_username UNIQUE (username)

	-- -- Foreign Keys
  -- CONSTRAINT fk_users_country_id FOREIGN KEY (country_id) REFERENCES country (id) ON DELETE CASCADE
);

CREATE TABLE teams (
  id SERIAL,
  name varchar(255) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_name UNIQUE (name)
);

CREATE TABLE userTeams (
  id SERIAL,
  user_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  PRIMARY KEY (id)

	-- -- Foreign Keys
  -- CONSTRAINT fk_userTeams_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  -- CONSTRAINT fk_userTeams_team_id FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
);



