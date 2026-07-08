# WWYD Discord Bot

This bot sends out Riichi Mahjong WWYD quizzes every day at 10am ET for members to complete. It includes a leaderboard
with stat tracking, and offers members an option to do practice WWYDs.

## Invite

[Discord OAuth Invite Link](https://discord.com/oauth2/authorize?client_id=1434270517128466574)

## Commands

**Daily Wwyd**:

* `/wwyd leaderboard`: Guild leaderboard. Optional parameter `season` to select which season to use
* `/wwyd score`: Guild score. Optional parameter `season` to select which season to use, optional parameter `hidden` if you want the score to be hidden or not.

**WWYD Config** (Users require Manage-Channels Permission to use):

* `/wwyd_config menu`: Brings up an interactive menu for the bot


**Random Commands**:

* `/wwyd_random`: Generates a random WWYD for practice

**Sim Commands**:

* `/pystyle`: Evaluates a inputted hand with PyStyle
* `/naga (link)`: Formats a Naga Sim

**Deprecated**:

* `/wwyd_config toggle`: Toggles wwyd daily for the channel
* `/wwyd_config force`: Forces the bot to send a daily WWYD in the channel
* `/wwyd_config new_season`: Creates a new season for the server. The next wwyd sent will
* `/wwyd_config autoseason`: Toggles autoseason for the guild. New seasons will begin on the 1st of every month.


## How to Use

To setup daily quizzes, run `/wwyd_config menu` in a discord channel. This will make the bot send out daily WYWYD
quizzes at 10am ET. You can also run `/wwyd_config force` to force send another daily wwyd.

To practice on your own, you can use `/wwyd_random` which will send a private message to you with a practice WWYD.

## Cool Images

![Daily WWYD Quiz](docs/images/daily_example.png)

![Daily WWYD Quiz Answer](docs/images/daily_example_answer.png)

![WWYD Quiz Leaderboard](docs/images/leaderboard.png)


## Credits

A big hanks to everyone who contributed to making this bot possible.

Special acknowledgment is given to: 
- /mjg/ community for providing the [Uzaku WWYDs](https://github.com/vg-mjg/mjg-repo/blob/master/wwyd/wwyd.json)
- Hue for editing and proofreading the Nanikiru WWYDs
- Navitas, Hue, Fumsa for advising on the WWYDs
- Zihao Huang for adding sources to the Uzaku WWYDs
