import csv
import json

tcp = {}
udp = {}

with open("service-names-port-numbers.csv", "r") as f:
    reader = csv.reader(f, delimiter=";", )
    for row in reader:
        try:
            port = int(row[1])
        except ValueError:
            continue

        if row[0] == "":
            continue

        print row[0], row[1], row[2]

        if row[2] == "udp" and port not in udp:
            udp[port] = row[0]
        if row[2] == "tcp" and port not in tcp:
            tcp[port] = row[0]



with open("serviceNames.json", "w") as f:
    dict = {
        6: tcp,
        17: udp
    }
    out = json.dumps(dict, sort_keys=True)
    print out
    f.write(out)
