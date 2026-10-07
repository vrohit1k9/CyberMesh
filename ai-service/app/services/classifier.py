import re
from typing import Dict, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# Synthetic training dataset of cybercrime complaints
TRAINING_SAMPLES = [
    # UPI_FRAUD
    ("Sent money on Google Pay UPI to QR code fraudster never received item", "UPI_FRAUD"),
    ("Requested refund on PhonePe, asked to approve collect request pin deducted", "UPI_FRAUD"),
    ("Scan QR code to receive cashback payment debited through BHIM UPI", "UPI_FRAUD"),
    ("Sent amount to fastrefund@okaxis after deceptive customer care call", "UPI_FRAUD"),
    ("Unauthorized UPI debit transaction through Paytm handle", "UPI_FRAUD"),

    # PHISHING
    ("Received SMS regarding electricity bill disconnection click link to update", "PHISHING"),
    ("Fake link sent on WhatsApp asking to update KYC or SIM blocked", "PHISHING"),
    ("Clicked link secure-kyc-update.xyz asking for netbanking credentials", "PHISHING"),
    ("Phishing email claiming income tax refund with attachment portal", "PHISHING"),
    ("Spoofed courier tracking page asking to verify delivery fee", "PHISHING"),

    # BANK_FRAUD
    ("Caller pretended to be bank manager asking for debit card CVV and OTP", "BANK_FRAUD"),
    ("NetBanking password compromised and funds transferred via IMPS to unknown account", "BANK_FRAUD"),
    ("Fraudulent debit from savings account without authorization or SMS alert", "BANK_FRAUD"),
    ("Caller asked to download AnyDesk and money siphoned from SBI account", "BANK_FRAUD"),
    ("Cloned ATM card withdrawal from unfamiliar branch terminal", "BANK_FRAUD"),

    # INVESTMENT_SCAM
    ("Lured into Telegram high return daily profit cryptocurrency trading group", "INVESTMENT_SCAM"),
    ("Fake forex platform apex-forex-trade promised 300% returns on deposit", "INVESTMENT_SCAM"),
    ("Asked to invest in IPO allotment scheme through fake broker portal", "INVESTMENT_SCAM"),
    ("Deposited money into trading account but withdrawal blocked unless fee paid", "INVESTMENT_SCAM"),
    ("Stock market VIP tips signal group siphoning funds into mule accounts", "INVESTMENT_SCAM"),

    # JOB_SCAM
    ("Part-time job rating YouTube videos and e-commerce reviews paid deposit", "JOB_SCAM"),
    ("Received job offer letter for HR executive asking for training registration fees", "JOB_SCAM"),
    ("Work from home task scam on Telegram deposit money to unlock next mission", "JOB_SCAM"),
    ("Fake airline recruitment letter demanding uniform and security deposit", "JOB_SCAM"),
    ("Data entry job contract breach legal threat demanding settlement money", "JOB_SCAM"),

    # SHOPPING_FRAUD
    ("Ordered iPhone on Instagram page with heavy discount item never delivered", "SHOPPING_FRAUD"),
    ("Fake website selling branded shoes prepaid order seller stopped responding", "SHOPPING_FRAUD"),
    ("OLX buyer sent fake payment screenshot and QR code to take money", "SHOPPING_FRAUD"),
    ("Purchased electronics on lookalike shopping site payment debited no receipt", "SHOPPING_FRAUD"),

    # IDENTITY_THEFT
    ("Unknown person took personal loan from instant lending app using my PAN card", "IDENTITY_THEFT"),
    ("Found forged Aadhaar card used to open fraudulent bank accounts in my name", "IDENTITY_THEFT"),
    ("SIM swap fraud my mobile number deactivated and new SIM issued without consent", "IDENTITY_THEFT"),

    # ACCOUNT_TAKEOVER
    ("Hacked Instagram account asking followers for emergency money via UPI", "ACCOUNT_TAKEOVER"),
    ("WhatsApp account hijacked through verification code forward", "ACCOUNT_TAKEOVER"),
    ("Email password reset and primary credentials altered by unauthorized party", "ACCOUNT_TAKEOVER")
]

class ComplaintClassifier:
    def __init__(self):
        texts = [sample[0] for sample in TRAINING_SAMPLES]
        labels = [sample[1] for sample in TRAINING_SAMPLES]

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)),
            ('clf', MultinomialNB(alpha=0.1))
        ])
        self.pipeline.fit(texts, labels)
        self.classes_ = list(self.pipeline.classes_)

    def classify(self, text: str) -> Tuple[str, float, Dict[str, float], List[str]]:
        """
        Predicts category, confidence, class probabilities, and top indicative terms
        """
        cleaned = re.sub(r'[^a-zA-Z\s]', ' ', text.lower())
        probas = self.pipeline.predict_proba([cleaned])[0]

        prob_dict = {cls: round(float(prob), 4) for cls, prob in zip(self.classes_, probas)}
        best_idx = probas.argmax()
        predicted_cat = self.classes_[best_idx]
        confidence = round(float(probas[best_idx]), 4)

        # Extract top predictive words from vectorizer
        tfidf = self.pipeline.named_steps['tfidf']
        feature_names = tfidf.get_feature_names_out()
        transformed = tfidf.transform([cleaned]).toarray()[0]
        top_indices = transformed.argsort()[-4:][::-1]
        indicative_words = [feature_names[i] for i in top_indices if transformed[i] > 0]

        return predicted_cat, confidence, prob_dict, indicative_words

# Singleton instance
classifier_instance = ComplaintClassifier()

def get_classifier():
    return classifier_instance
