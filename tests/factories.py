"""
Factory classes for generating test data using factory_boy.
"""
import factory
from faker import Faker
from datetime import datetime, date
import random

fake = Faker()

class Step7DataFactory(factory.Factory):
    """Factory for generating Step 7 (vendor) data."""
    
    class Meta:
        model = dict
    
    logged_timestamp = factory.LazyAttribute(lambda o: fake.date_between(start_date='-30d', end_date='today').strftime('%Y-%m-%d'))
    
    # 3DE TECH data
    UID = factory.LazyAttribute(lambda o: fake.unique.bothify(text='3DE###'))
    # Fix: Use proper attribute names for 3DE MO
    _3DE_MO = factory.LazyAttribute(lambda o: f"MO{fake.unique.random_number(digits=3)}")
    SKU = factory.LazyAttribute(lambda o: f"SKU{fake.random_number(digits=3)}")
    SIZE = factory.LazyAttribute(lambda o: str(fake.random_int(min=6, max=12)))
    
    # IHC data
    IHC = factory.LazyAttribute(lambda o: fake.unique.bothify(text='IHC###'))
    IHC_MO = factory.LazyAttribute(lambda o: f"IHCMO{fake.unique.random_number(digits=3)}")
    IHC_SKU = factory.LazyAttribute(lambda o: f"IHCSKU{fake.random_number(digits=3)}")
    IHC_SIZE = factory.LazyAttribute(lambda o: str(fake.random_int(min=6, max=12)))
    
    # MAKENICA data
    MAKENICA = factory.LazyAttribute(lambda o: fake.unique.bothify(text='MK###'))
    MK_MO = factory.LazyAttribute(lambda o: f"MKMO{fake.unique.random_number(digits=3)}")
    MAKENICA_SKU = factory.LazyAttribute(lambda o: f"MKSKU{fake.random_number(digits=3)}")
    MAKENICA_SIZE = factory.LazyAttribute(lambda o: str(fake.random_int(min=6, max=12)))

class VQCDataFactory(factory.Factory):
    """Factory for generating VQC data."""
    
    class Meta:
        model = dict
    
    UID = factory.LazyAttribute(lambda o: fake.bothify(text='???###'))
    Status = factory.LazyAttribute(lambda o: fake.random_element(elements=('ACCEPTED', 'REJECTED')))
    
    @factory.lazy_attribute
    def Reason(self):
        if self.Status == 'REJECTED':
            return fake.random_element(elements=(
                'BLACK GLUE', 'WHITE PATCH ON BATTERY', 'MICRO BUBBLES',
                'SENSOR ISSUE', 'SCRATCHES ON RESIN'
            ))
        return ''

class FTDataFactory(factory.Factory):
    """Factory for generating FT (Functional Test) data."""
    
    class Meta:
        model = dict
    
    UID = factory.LazyAttribute(lambda o: fake.bothify(text='???###'))
    # Fix: Use proper attribute name for Test Result
    Test_Result = factory.LazyAttribute(lambda o: fake.random_element(elements=('PASS', 'FAIL')))
    
    @factory.lazy_attribute
    def Comments(self):
        if getattr(self, 'Test_Result', 'PASS') == 'FAIL':
            return fake.random_element(elements=(
                'BATTERY ISSUE', 'CHARGING CODE ISSUE', 'NOT CHARGING',
                'BLUETOOTH HEIGHT ISSUE', 'CURRENT ISSUE'
            ))
        return ''

class RingDataFactory(factory.Factory):
    """Factory for generating merged ring data."""
    
    class Meta:
        model = dict
    
    date = factory.LazyAttribute(lambda o: fake.date_between(start_date='-30d', end_date='today'))
    vendor = factory.LazyAttribute(lambda o: fake.random_element(elements=('3DE TECH', 'IHC', 'MAKENICA')))
    serial_number = factory.LazyAttribute(lambda o: fake.unique.bothify(text='???###'))
    mo_number = factory.LazyAttribute(lambda o: f"MO{fake.random_number(digits=3)}")
    sku = factory.LazyAttribute(lambda o: f"SKU{fake.random_number(digits=3)}")
    ring_size = factory.LazyAttribute(lambda o: str(fake.random_int(min=6, max=12)))
    vqc_status = factory.LazyAttribute(lambda o: fake.random_element(elements=('ACCEPTED', 'REJECTED', '')))
    ft_status = factory.LazyAttribute(lambda o: fake.random_element(elements=('PASS', 'FAIL', '')))
    
    @factory.lazy_attribute
    def vqc_reason(self):
        if self.vqc_status == 'REJECTED':
            return fake.random_element(elements=(
                'BLACK GLUE', 'WHITE PATCH ON BATTERY', 'MICRO BUBBLES',
                'SENSOR ISSUE', 'SCRATCHES ON RESIN'
            ))
        return ''
    
    @factory.lazy_attribute
    def ft_reason(self):
        if self.ft_status == 'FAIL':
            return fake.random_element(elements=(
                'BATTERY ISSUE', 'CHARGING CODE ISSUE', 'NOT CHARGING',
                'BLUETOOTH HEIGHT ISSUE', 'CURRENT ISSUE'
            ))
        return ''

class GoogleConfigFactory(factory.Factory):
    """Factory for generating Google Sheets configuration."""
    
    class Meta:
        model = dict
    
    @factory.lazy_attribute
    def serviceAccountContent(self):
        return {
            'type': 'service_account',
            'project_id': f'test-project-{fake.random_number(digits=6)}',
            'private_key_id': fake.uuid4(),
            'private_key': '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----\n',
            'client_email': fake.email(),
            'client_id': str(fake.random_number(digits=12)),
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token'
        }
    
    vendorDataUrl = factory.LazyAttribute(lambda o: f"https://docs.google.com/spreadsheets/d/{fake.uuid4()}/edit")
    vqcDataUrl = factory.LazyAttribute(lambda o: f"https://docs.google.com/spreadsheets/d/{fake.uuid4()}/edit")
    ftDataUrl = factory.LazyAttribute(lambda o: f"https://docs.google.com/spreadsheets/d/{fake.uuid4()}/edit")

class DatabaseConfigFactory(factory.Factory):
    """Factory for generating database configuration."""
    
    class Meta:
        model = dict
    
    dbHost = factory.LazyAttribute(lambda o: fake.ipv4())
    dbPort = '5432'
    dbName = factory.LazyAttribute(lambda o: f"test_db_{fake.random_number(digits=4)}")
    dbUser = factory.LazyAttribute(lambda o: fake.user_name())
    dbPassword = factory.LazyAttribute(lambda o: fake.password())

def create_batch_ring_data(count=100, **kwargs):
    """Create a batch of ring data for testing."""
    return RingDataFactory.create_batch(count, **kwargs)

def create_test_dataset():
    """Create a comprehensive test dataset."""
    # Create 30 days of data
    rings = []
    for i in range(30):
        test_date = fake.date_between(start_date='-30d', end_date='today')
        daily_rings = create_batch_ring_data(
            count=fake.random_int(min=50, max=150),
            date=test_date
        )
        rings.extend(daily_rings)
    
    return rings