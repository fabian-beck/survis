import os
import json, codecs, time

dataDir = "src/data/"
bibFile = "bib/references.bib"
generatedDir = dataDir + "generated/"
bibJsFile = generatedDir + "bib.js"
papersDir = dataDir + "papers_pdf/"
papersImgDir = dataDir + "papers_img/"
availablePdfFile = generatedDir + "available_pdf.js"
availableImgFile = generatedDir + "available_img.js"


def parseBibtex(bibFile):
    parsedData = {}
    lastField = ""
    with codecs.open(bibFile, "r", "utf-8-sig") as fIn:
        currentId = ""
        for line in fIn:
            line = line.strip("\n").strip("\r")
            if line.startswith("@"):
                currentId = line.split("{")[1].rstrip(",\n")
                currentType = line.split("{")[0].strip("@ ")
                parsedData[currentId] = {"type":currentType}
            if currentId != "":
                if "=" in line:
                    field = line.split("=")[0].strip().lower()
                    value = line.split("=")[1].strip("} \n").replace("},","").strip()
                    if len(value) > 0 and value[0] == "{":
                        value = value[1:]
                    if field in parsedData[currentId]:
                        parsedData[currentId][field] = parsedData[currentId][field] + " " +value
                    else:
                        parsedData[currentId][field] = value
                    lastField = field
                else:
                    if lastField in parsedData[currentId]:
                        value = line.strip()
                        value = value.strip("} \n").replace("},","").strip()
                        if len(value)>0:
                            parsedData[currentId][lastField] = parsedData[currentId][field] + " " + value
        fIn.close()
    return parsedData

def writeJSON(parsedData):
    with codecs.open(bibJsFile, "w", "utf-8-sig") as fOut:
        fOut.write("define({ entries : ")
        fOut.write(json.dumps(parsedData, sort_keys=True,indent=4, separators=(',', ': ')))
        fOut.write("});")
        fOut.close()

def listAvailablePdf():
    #papersDirWin = papersDir.replace("/", "\\")
    fOut = open(availablePdfFile, "w")
    s = "define({availablePdf: ["
    count = 0
    for file in os.listdir(papersDir):
        if file.endswith(".pdf"):
            s+= "\""+file.replace(".pdf","")+"\","
            count += 1
    if count > 0:
        s = s[:len(s) - 1]
    s+= "]});"
    fOut.write(s)
    
def listAvailableImg():
    fOut = open(availableImgFile, "w")
    s = "define({ availableImg: ["
    count = 0
    for file in os.listdir(papersImgDir):
        if file.endswith(".png"):
            s+= "\""+file.replace(".png","")+"\","
            count += 1
    if count > 0:
        s = s[:len(s) - 1]
    s+= "]});"
    fOut.write(s)

def update():
    print("convert bib file")
    writeJSON(parseBibtex(bibFile))
    print("list available paper PDF files")
    listAvailablePdf()
    print("list available paper images")
    listAvailableImg()
    print("done")

prevBibTime = 0
while True:
    currentBibTime = os.stat(bibFile).st_mtime
    if (prevBibTime != currentBibTime):
        print("detected change in bib file")
        update()
        prevBibTime = currentBibTime
    else:
        print("waiting for changes in bib file: "+bibFile)
    time.sleep(1);
