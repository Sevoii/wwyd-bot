# Database Schema

## `SchemaMigration`

Contains history of which migrations were performed when

Key: `(version)`

| Field     | Datatype  | Description               | Notes                     |
|-----------|-----------|---------------------------|---------------------------|
| `name`    | `TEXT`    | Name of the patch applied | Only used for maintainers |
| `version` | `INTEGER` | ID of the patch applied   |                           | 

## `UserScore`

Contains basic user data including streak data as it is preserved through seasons. Scores are in `SeasonScores`.

Key: `(guild_id, discord_id)`

| Field         | Datatype       | Description                              | Notes |
|---------------|----------------|------------------------------------------|-------|
| `guild_id`    | `VARACHAR(18)` | Discord Guild Id where the user answered |       |
| `discord_id`  | `VACHAR(18)`   | Discord User Id                          |       |
| `streak`      | `INTEGER`      | Current user streak                      |       |
| `best_streak` | `INTEGER`      | Best user sterak                         |       |

## `Season`

Contains basic season info. New seasons are inactive until the daily trigger.

Key: `(guild_id, season)`

| Field       | Datatype      | Description                                   | Notes                                                 |
|-------------|---------------|-----------------------------------------------|-------------------------------------------------------|
| `guild_id`  | `VARCHAR(18)` | Discord Guild ID where the user answered      |                                                       |
| `season`    | `INTEGER`     | Guild Season                                  |                                                       |
| `is_active` | `BOOLEAN`     | Whether the season is currently active or not | Stored as an integer due to SQLITE not having BOOLEAN | 

## `SeasonScores`

Contains scores for each user.

Key: `(guild_id, discord_id)`

| Field        | Datatype       | Description                              | Notes           |
|--------------|----------------|------------------------------------------|-----------------|
| `guild_id`   | `VARACHAR(18)` | Discord Guild Id where the user answered |                 |
| `discord_id` | `VACHAR(18)`   | Discord User Id                          |                 |
| `season`     | `INTEGER`      | Guild Season                             |                 |
| `score`      | `INTEGER`      | Current season score (# corrent answers) | Used for points |
| `attempts`   | `INTEGER`      | Current season attempts (# answers)      | Used for %      |

## `WwydChannels`

Contains list of channels which we need to send daily messages to.

Key: `(guild_id)`

| Field        | Datatype       | Description                                                       | Notes                                                 |
|--------------|----------------|-------------------------------------------------------------------|-------------------------------------------------------|
| `guild_id`   | `VARACHAR(18)` | Discord Guild Id where the problem is sent                        |                                                       |
| `channel_id` | `VARCHAR(18)`  | Discord Channel Id where the message should be sent               | Needed to edit the message                            |
| `autoseason` | `BOOLEAN`      | Whether the guild will automatically increment season every month | Stored as an integer due to SQLITE not having BOOLEAN |

## `WwydDaily`

List of wwyd messages that we've sent out.

Key: `(guild_id, problem_id)`

| Field         | Datatype       | Description                                   | Notes                             |
|---------------|----------------|-----------------------------------------------|-----------------------------------|
| `guild_id`    | `VARACHAR(18)` | Discord Guild Id where the problem is sent    |                                   |
| `problem_id`  | `VARACHAR(18)` | Internally Generated Problem Id               | Used to make people not answer qs |
| `internal_id` | `INTEGER`      | Internal ID of the wwyd                       | Fairly fragile                    |
| `channel_id`  | `VARCHAR(18)`  | Discord Channel Id where the message was sent | Needed to edit the message        |
| `message_id`  | `VARCHAR(18)`  | Discord Message Id of the message             | Needed to edit the message        |
| `created`     | `DATETIME`     | Datetime of when the message was sent         |                                   |

## `WwydScore`

Internal list of scores which is not used anywhere.

Key: `(guild_id, problem_id, discord_id)`

| Field        | Datatype       | Description                              | Notes                                                 |
|--------------|----------------|------------------------------------------|-------------------------------------------------------|
| `guild_id`   | `VARACHAR(18)` | Discord Guild Id where the user answered |                                                       |
| `problem_id` | `VARACHAR(18)` | Internally Generated Problem Id          | Used to make people not answer qs                     |
| `discord_id` | `VACHAR(18)`   | Discord User Id                          |                                                       |
| `correct`    | `BOOLEAN`      | Whether the user was correct or not      | Stored as an integer due to SQLITE not having BOOLEAN | 
| `answer`     | `VARCHAR(2)`   | The user's answer                        | Does not matter if it was correct or not              |
