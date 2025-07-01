import requests
import ipaddress
import socket
import sqlite3
from datetime import datetime
import re
from bs4 import BeautifulSoup
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# کلیدهای API (با کلیدهای خودت جایگزین کن)
ABUSEIPDB_KEY = "11e9cbd8c7b5b2bf17a689c6ba61236287f62f7ca19c64d05a7bd420f5affe68"
PROXYCHECK_KEY = "g4h996-3u1579-40s3e7-f18k55"
SHODAN_KEY = "wgH9c7KfZkbXhfi4McSpivgFfsCqFAJm"
IPINFO_KEY = "df7861fa741dbf"

# پورت‌های مهم ماینینگ
MINEING_PORTS = [22, 443, 80]

# مدل های هوش مصنوعی و ماشین یادگیری
class Model:
    def __init__(self):
        self.model = None

    def train(self, X_train, y_train):
        if self.model is not None:
            return
        #_model = RandomForestClassifier(n_estimators=100)
        _model = Sequential()
        _model.add(Dense(64, activation='relu', input_shape=(X_train.shape[1],)))
        _model.add(Dropout(0.2))
        _model.add(Dense(32, activation='relu'))
        _model.add(Dropot(0.5))
        _model.add(Dense(len(set(y_train)), activation='softmax'))

        self.model = _model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    def predict(self, X_test):
        if self.model is None:
            return
        y_pred = self.model.predict(X_test)
        return y_pred

class IPModel(Model):
    def __init__(self):
        super().__init__()
        self.tokenizer = Tokenizer()
        self.sequence_model = Sequential()

    def train(self, X_train, y_train):
        if self.model is not None:
            return
        # مدل برای تشخیص IP های مشکوک
        self.tokenizer.fit_on_texts(X_train['IP'])
        sequences = self.tokenizer.texts_to_sequences(X_train['IP'])

        X_train_seq = pad_sequences(sequences, maxlen=100)
        y_train_cat = to_categorical(y_train)

        train_X, val_X, train_y, val_y = train_test_split(X_train_seq, y_train_cat, test_size=0.2, random_state=42)

        self.sequence_model.add(Dense(64, activation='relu', input_shape=(X_train.shape[1],)))
        self.sequence_model.add(Dropout(0.2))
        self.sequence_model.add(Dense(32, activation='relu'))
        self.sequence_model.add(Dropot(0.5))
        self.sequence_model.add(Dense(len(set(y_train)), activation='softmax'))

        self.model = self.sequence_model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    def predict(self, X_test):
        if self.model is None:
            return
        y_pred = self.model.predict(X_test)
        return y_pred

class PortModel(Model):
    def __init__(self):
        super().__init__()
        # مدل برای تشخیص پورت های باز در IP'S مشکوک
        self.sequence_model = Sequential()

    def train(self, X_train, y_train):
        if self.model is not None:
            return
        self.sequence_model.add(Dense(64, activation='relu', input_shape=(X_train.shape[1],)))
        self.sequence_model.add(Dropout(0.2))
        self.sequence_model.add(Dense(32, activation='relu'))
        self.sequence_model.add(Dropot(0.5))
        self.sequence_model.add(Dense(len(set(y_train)), activation='softmax'))

        self.model = self.sequence_model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    def predict(self, X_test):
        if self.model is None:
            return
        y_pred = self.model.predict(X_test)
        return y_pred

class ShodanModel(Model):
    def __init__(self):
        super().__init__()
        # مدل برای تشخیص IP'S مشکوک بر اساس شودان
        self.sequence_model = Sequential()

    def train(self, X_train, y_train):
        if self.model is not None:
            return
        self.sequence_model.add(Dense(64, activation='relu', input_shape=(X_train.shape[1],)))
        self.sequence_model.add(Dropout(0.2))
        self.sequence_model.add(Dense(32, activation='relu'))
        self.sequence_model.add(Dropot(0.5))
        self.sequence_model.add(Dense(len(set(y_train)), activation='softmax'))

        self.model = self.sequence_model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    def predict(self, X_test):
        if self.model is None:
            return
        y_pred = self.model.predict(X_test)
        return y_pred

class IPInfoModel(Model):
    def __init__(self):
        super().__init__()
        # مدل برای تشخیص IP'S مشکوک بر اساس اطلاعات IPINFO
        self.sequence_model = Sequential()

    def train(self, X_train, y_train):
        if self.model is not None:
            return
        self.sequence_model.add(Dense(64, activation='relu', input_shape=(X_train.shape[1],)))
        self.sequence_model.add(Dropout(0.2))
        self.sequence_model.add(Dense(32, activation='relu'))
        self.sequence_model.add(Dropot(0.5))
        self.sequence_model.add(Dense(len(set(y_train)), activation='softmax'))

        self.model = self.sequence_model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    def predict(self, X_test):
        if self.model is None:
            return
        y_pred = self.model.predict(X_test)
        return y_pred

class MineingModel(Model):
    def __init__(self):
        super().__init__()
        # مدل برای تشخیص IP'S مشکوک بر اساس پورت های باز در ماینینگ
        self.sequence_model = Sequential()

    def train(self, X_train, y_train):
        if self.model is not None:
            return
        self.sequence_model.add(Dense(64, activation='relu', input_shape=(X_train.shape[1],)))
        self.sequence_model.add(Dropout(0.2))
        self.sequence_model.add(Dense(32, activation='relu'))
        self.sequence_model.add(Dropot(0.5))
        self.sequence_model.add(Dense(len(set(y_train)), activation='softmax'))

        self.model = self.sequence_model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    def predict(self, X_test):
        if self.model is None:
            return
        y_pred = self.model.predict(X_test)
        return y_pred

# استفاده از مدل ها برای تشخیص IP'S مشکوک
def detect_ip(model, ip):
    #model را در حال_train می کند و آن را به.ip đưa
    model.train([{'IP': ip}], [0])
    result = model.predict([[ip]])
    if result[0][0] == 1:
        return "IP مشکوک است"
    else:
        return "IPSAFE"

def detect_port(model, port):
    #model را در حال_train می کند و آن را به.port đưa
    model.train([{'port': port}], [0])
    result = model.predict([[port]])
    if result[0][0] == 1:
        return "پورت باز است"
    else:
        return "پورت بسته"

def detect_shodan(model, ip):
    #model را در حال_train می کند و آن را به.ip đưa
    model.train([{'IP': ip}], [0])
    result = model.predict([[ip]])
    if result[0][0] == 1:
        return "IP مشکوک است"
    else:
        return "IPSAFE"

def detect_ipinfo(model, ip):
    #model را در حال_train می کند و آن را به.ip đưa
    model.train([{'IP': ip}], [0])
    result = model.predict([[ip]])
    if result[0][0] == 1:
        return "IP مشکوک است"
    else:
        return "IPSAFE"

def detect_mineing(model, port):
    #model را در حال_train می کند و آن را به.port đưa
    model.train([{'port': port}], [0])
    result = model.predict([[port]])
    if result[0][0] == 1:
        return "پورت باز است"
    else:
        return "پورت بسته"

# استفاده از مدل ها برای تشخیص IP'S مشکوک
def main():
    #-model های را در حال_train می کند و آن را به IP's đưa
    ip_model = IPModel()
    port_model = PortModel()
    shodan_model = ShodanModel()
    ipinfo_model = IPInfoModel()
    mineing_model = MineingModel()

    X_train = pd.DataFrame({
        'IP': ['192.168.1.100', '192.168.1.101'],
        'port': [22, 443],
        'shodan': [0, 1],
        'ipinfo': [0, 1]
    })

    y_train = np.array([0, 1])

    ip_model.train(X_train, y_train)
    port_model.train(X_train, y_train)
    shodan_model.train(X_train, y_train)
    ipinfo_model.train(X_train, y_train)
    mineing_model.train(X_train, y_train)

    # IP's را تشخیص می دهد
    ips = ['192.168.1.100', '192.168.1.101']
    for ip in ips:
        print(detect_ip(ip_model, ip))
        print(detect_port(port_model, 22))
        print(detect_shodan(shodan_model, ip))
        print(detect_ipinfo(ipinfo_model, ip))
        print(detect_mineing(mineing_model, 443))

if __name__ == "__main__":
    main()


