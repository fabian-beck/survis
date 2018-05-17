import os
import json
import codecs
import time
import logging
from typing import List
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import bibtexparser

logging.getLogger().setLevel(logging.DEBUG)

cwd = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(cwd, "src", "data")
BIB_DIR = os.path.join(cwd, "bib")
BIB_FILE = os.path.join(BIB_DIR, "references.bib")
GENERATED_DIR = os.path.join(DATA_DIR, "generated")
PAPERS_DIR = os.path.join(DATA_DIR, "papers_pdf")
PAPERS_IMG_DIR = os.path.join(DATA_DIR, "papers_img")
BIB_JS_FILE = os.path.join(GENERATED_DIR, "bib.js")
AVAILABLE_PDF_FILES = os.path.join(GENERATED_DIR, "available_pdf.js")
AVAILABLE_IMG_FILES = os.path.join(GENERATED_DIR, "available_img.js")


class Watcher:
    def __init__(self):
        self.observer = Observer()

    def run(self):
        event_handler = Handler()
        self.observer.schedule(event_handler, BIB_DIR)
        self.observer.start()
        try:
            while True:
                time.sleep(1)
        except:
            self.observer.stop()
            logging.error("Error")
        self.observer.join()


class Handler(FileSystemEventHandler):

    @staticmethod
    def on_any_event(event):
        try:
            assert event.event_type == "modified"
            assert not event.is_directory
            assert event.src_path == BIB_FILE
            logging.info(f"Received modified event - {event.src_path}")
            update()
        except AssertionError:
            # Ignore everything that's not related to ./bib/references.bib
            return


def write_bibtex(parsedData: dict):
    with open(BIB_JS_FILE, "w") as the_file:
        """python-bibtexparser stores the bibtex entry's type in `ENTRYTYPE`. SurVis frontend however expects it in `type`. So we have to manually change it.
        """
        for key, value in parsedData.items():
            parsedData[key]["type"] = parsedData[key].pop("ENTRYTYPE")
            # remove field `ID`
            parsedData[key].pop("ID")
        the_file.write(f"define({{entries: {json.dumps(parsedData, sort_keys=True, indent=4, separators=(',', ': '))} }});")


def list_available_pdf():
    with open(AVAILABLE_PDF_FILES, "w") as the_file:
        pdf_files = list_entities(PAPERS_DIR, ".pdf")
        s = f"define({{availablePdf: {pdf_files}}});"
        the_file.write(s)


def list_available_img():
    with open(AVAILABLE_IMG_FILES, "w") as the_file:
        png_files = list_entities(PAPERS_IMG_DIR, ".png")
        s = f"define({{availableImg: {png_files}}});"
        the_file.write(s)


def list_entities(dir: str, ext: str) -> List[str]:
    """Reads all files from `dir`, that end in `ext`.
    """
    return [f.replace(ext, "") for f in os.listdir(dir) if f.endswith(ext)]


def update():
    logging.info("convert bib file")
    with open(BIB_FILE) as bibtex_file:
        bib_database = bibtexparser.load(bibtex_file)
        write_bibtex(bib_database.entries_dict)

    logging.info("list available paper PDF files")
    list_available_pdf()

    logging.info("list available paper images")
    list_available_img()

    logging.info("done")


if __name__ == "__main__":

    # Create the mandatory output directories for the generated content.
    for d in [GENERATED_DIR, PAPERS_DIR, PAPERS_IMG_DIR]:
        new_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), d)
        try:
            os.makedirs(new_dir)
        except FileExistsError as e:
            logging.debug(f"{new_dir} already exists. Skipping!")

    update()
    w = Watcher()
    w.run()
