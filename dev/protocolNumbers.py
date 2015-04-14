import csv
import json

networkProtocols = {}

with open("protocol-numbers-1.csv", "r") as f:
    reader = csv.reader(f, delimiter=";", )
    for row in reader:
        if row[0] == "Decimal" or row[0] == "143-252" or row[1] == "":
            continue

        print row[0]
        n = int(row[0])
        print n
        networkProtocols[n] = row[1]


with open("networkProtocols.json", "w") as f:
    out = json.dumps(networkProtocols, sort_keys=True)
    print out
    f.write(out)
