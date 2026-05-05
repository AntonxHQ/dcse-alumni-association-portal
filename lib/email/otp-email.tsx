import { Body, Container, Head, Heading, Html, Preview, Section, Text, Hr } from '@react-email/components';

type OtpEmailProps = {
  fullName: string;
  otp: string;
};

export function OtpEmail({ fullName, otp }: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your CSE Alumni Portal verification code: {otp}</Preview>
      <Body style={{ backgroundColor: '#1C1C1C', fontFamily: 'Inter, sans-serif', color: '#EDEDED' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
          <Section style={{ backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2E2E2E', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#3ECF8E', borderRadius: '4px', marginRight: '10px' }} />
              <Text style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#EDEDED' }}>CSE Alumni Portal</Text>
            </div>

            <Heading style={{ fontSize: '20px', fontWeight: 500, color: '#EDEDED', margin: '0 0 8px' }}>
              Verify your email address
            </Heading>
            <Text style={{ fontSize: '14px', color: '#A1A1A1', margin: '0 0 24px' }}>
              Hi {fullName}, use the code below to verify your email and complete your registration.
            </Text>

            <Hr style={{ borderColor: '#2E2E2E', margin: '0 0 24px' }} />

            <Text style={{ fontSize: '12px', color: '#6E6E6E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              VERIFICATION CODE
            </Text>
            <Text style={{ fontSize: '36px', fontWeight: 700, color: '#3ECF8E', letterSpacing: '0.2em', fontFamily: 'monospace', margin: '0 0 24px' }}>
              {otp}
            </Text>

            <Hr style={{ borderColor: '#2E2E2E', margin: '0 0 24px' }} />

            <Text style={{ fontSize: '13px', color: '#6E6E6E', margin: 0 }}>
              This code expires in 10 minutes. If you did not create an account, you can safely ignore this email.
            </Text>
          </Section>

          <Text style={{ fontSize: '12px', color: '#6E6E6E', textAlign: 'center', marginTop: '24px' }}>
            © {new Date().getFullYear()} Computer Systems Engineering Department
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
