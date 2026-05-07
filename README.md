# WWYD Discord Bot

This bot sends out Riichi Mahjong WWYD quizzes every day at 10am ET for members to complete. It includes a leaderboard
with stat tracking, and offers members an option to do practice WWYDs.

## Invite

[Discord OAuth Invite Link](https://discord.com/oauth2/authorize?client_id=1434270517128466574&permissions=68608&integration_type=0&scope=bot+applications.commands)

## Commands

Daily Wwyd:

* `/wwyd leaderboard`: Guild leaderboard. Optional parameter `season` to select which season to use
* `/wwyd score`: Guild score. Optional parameter `season` to select which season to use, optional parameter `hidden` if you want the score to be hidden or not.

Wwyd Config (Requires Manage-Channels Permission to use)

* `/wwyd_config toggle`: Toggles wwyd daily for the channel
* `/wwyd_config force`: Forces the bot to send a daily WWYD in the channel
* `/wwyd_config new_season`: Creates a new season for the server. The next wwyd sent will 
* `/wwyd_config autoseason`: Toggles autoseason for the guild. New seasons will begin on the 1st of every month. 

Random Commands:

* `/wwyd_random`: Generates a random WWYD for practice
* `/pystyle`: Evaluates a inputted hand with PyStyle

## How to Use

To setup daily quizzes, run `/wwyd_config toggle` in a discord channel. This will make the bot send out daily WYWYD
quizzes at 10am ET. You can also run `/wwyd_config force` to force send another daily wwyd. The wwyd that comes from this
will update in the database.

To practice on your own, you can do `wwyd_random` which will send an ephermeal message to you with a formatted WWYD.

## Examples

![Daily WWYD Quiz](docs/images/daily_example.png)

![Daily WWYD Quiz Answer](docs/images/daily_example_answer.png)

![WWYD Quiz Leaderboard](docs/images/leaderboard.png)


## Credits

A big hanks to everyone who contributed to making this bot possible. Special acknowledgment is given to the UW Riichi Club for providing the Uzaku WWYDs, Zihao Huang for adding sources to the Uzaku WWYDs, and Hue for editing and proofreading the nanikiru WWYDs. 