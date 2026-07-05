import json
import re

tiles = ["1m", "2m", "3m", "4m", "0m", "5m", "6m", "7m", "8m", "9m", "1p", "2p", "3p", "4p", "0p", "5p", "6p", "7p",
         "8p", "9p", "1s", "2s", "3s", "4s", "0s", "5s", "6s", "7s", "8s", "9s", "1z", "2z", "3z", "4z", "5z", "6z",
         "7z"]
tiles2 = ["1m", "2m", "3m", "4m", "0m", "5m", "6m", "7m", "8m", "9m", "1p", "2p", "3p", "4p", "0p", "5p", "6p", "7p",
          "8p", "9p", "1s", "2s", "3s", "4s", "0s", "5s", "6s", "7s", "8s", "9s", "1z", "2z", "3z", "N", "5z", "C",
          "7z"]
a = ["manzu", "pinzu", "souzu"]

winds = ["E", "S", "W", "N"]


def handle_comment(og):
    comment = []

    for i in og:
        if isinstance(i, str):
            p = re.split(r"([mM]anzu|[pP]inzu|[sS]ouzu)", i)
            comment += [{"type": "suit", "data": a.index(j.lower())} if j.lower() in a else {"type": "text", "data": j}
                        for j in p]
        else:
            comment.append({"type": "tile", "data": i})

    return comment


def handle_generic(data):
    source = data["source"]
    seat = winds.index(data["seat"])
    round = winds.index(data["round"])
    turn = int(data["turn"])
    hand = [tiles.index(i) for i in data["hand"]]
    indicator = tiles.index(data["indicator"])
    draw = tiles.index(data["draw"])
    answer = [tiles.index(data["answer"])] if isinstance(data["answer"], str) else [tiles.index(i) for i in
                                                                                    data["answer"]]
    # comment = [i if isinstance(i, str) else [tiles.index(j) for j in i] for i in data["comment"]]

    comment = []
    for i in handle_comment(data["comment"]):
        if i["type"] in ["tile"]:
            i["data"] = [tiles.index(j) for j in i["data"]]
        comment.append(i)

    # return [seat, turn, hand, draw, answer, comment]
    return {
        "round": round,
        "seat": seat,
        "turn": turn,
        "indicator": indicator,
        "hand": hand,
        "draw": draw,
        "answer": answer,
        "comment": comment
    }


def handle_pystyle(data):
    to_return = []

    for i in data:
        tile = tiles.index(i["tile"])
        shanten = i["shanten"]
        back = int(i["back"])
        wait_count = i["wait_count"]
        wait_unique = i["wait_unique"]
        wait_types = [tiles.index(j) for j in i["wait_types"]]
        value = i["value"]
        winning = i["winning"]
        tenpai = i["tenpai"]

        # to_return.append([tile, shanten, back, wait_count, wait_unique, wait_types, value, winning, tenpai])
        to_return.append({
            "tile": tile,
            "shanten": shanten,
            "back": back,
            "wait_count": wait_count,
            "wait_unique": wait_unique,
            "wait_types": wait_types,
            "value": value,
            "winning": winning,
            "tenpai": tenpai
        })

    return to_return


def handle_naga(data):
    to_return = [data["url"]]

    temp = []
    for i in data["data"]:
        tile = tiles2.index(i["tile"])
        mean = round(i["mean"], 4)
        var = round(i["var"], 4)
        win = round(i["win"], 4)
        num_sims = i["num_sims"]

        # temp.append([tile, mean, var, win, num_sims])
        temp.append({
            "tile": tile,
            "mean": mean,
            "var": var,
            "win": win,
            "num_sims": num_sims
        })

    to_return.append(temp)

    t_tiles = [tiles2.index(i) for i in data["t_test"]["tiles"]]
    t_t = data["t_test"]["t"]
    t_df = data["t_test"]["df"]
    t_p = data["t_test"]["p"]

    # to_return.append([t_tiles, t_t, t_df, t_p])

    # return to_return

    return {
        "url": data["url"],
        "data": temp,
        "t_test": {
            "tiles": t_tiles,
            "t": t_t,
            "df": t_df,
            "p": t_p
        }
    }


def handle_problem(problem):
    to_return = {
        "source": problem["source"],
        "problem": handle_generic(problem),
    }

    if "pystyle" in problem and problem["pystyle"]:
        to_return["pystyle"] = handle_pystyle(problem["pystyle"])

    if "naga" in problem:
        to_return["naga"] = handle_naga(problem["naga"])

    return to_return


with open("assets/wwyd-base.json") as f:
    data = json.load(f)

data = [handle_problem(i) for i in data]

with open("assets/wwyd.json", "w") as f:
    f.write("[\n")
    f.write(",\n".join(["  " + json.dumps(entry, separators=(',', ':')) for entry in data]))
    f.write("\n]")
