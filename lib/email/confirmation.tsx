import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';

type ConfirmationEmailProps = {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  isWaitlisted: boolean;
  waitlistPosition?: number;
};

export function ConfirmationEmail({
  attendeeName,
  eventTitle,
  eventDate,
  eventLocation,
  isWaitlisted,
  waitlistPosition,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {isWaitlisted
          ? `You're on the waitlist for ${eventTitle}`
          : `Your registration is confirmed for ${eventTitle}`}
      </Preview>
      <Body style={{ backgroundColor: '#1C1C1C', fontFamily: 'Inter, sans-serif', color: '#EDEDED' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
          <Section style={{ backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2E2E2E', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#3ECF8E', borderRadius: '4px', marginRight: '10px' }} />
              <Text style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#EDEDED' }}>CSE Alumni Portal</Text>
            </div>

            <Heading style={{ fontSize: '20px', fontWeight: 500, color: '#EDEDED', margin: '0 0 8px' }}>
              {isWaitlisted ? "You're on the waitlist!" : "You're registered!"}
            </Heading>
            <Text style={{ fontSize: '14px', color: '#A1A1A1', margin: '0 0 24px' }}>
              Hi {attendeeName}, {isWaitlisted
                ? `you've been added to the waitlist for this event.`
                : `your registration has been confirmed.`}
            </Text>

            <Hr style={{ borderColor: '#2E2E2E', margin: '0 0 24px' }} />

            <Text style={{ fontSize: '12px', color: '#6E6E6E', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              EVENT
            </Text>
            <Text style={{ fontSize: '16px', fontWeight: 500, color: '#EDEDED', margin: '0 0 16px' }}>
              {eventTitle}
            </Text>

            <Text style={{ fontSize: '12px', color: '#6E6E6E', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              DATE &amp; TIME
            </Text>
            <Text style={{ fontSize: '14px', color: '#A1A1A1', margin: '0 0 16px' }}>
              {eventDate}
            </Text>

            <Text style={{ fontSize: '12px', color: '#6E6E6E', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              LOCATION
            </Text>
            <Text style={{ fontSize: '14px', color: '#A1A1A1', margin: '0 0 24px' }}>
              {eventLocation}
            </Text>

            {isWaitlisted && waitlistPosition && (
              <>
                <Hr style={{ borderColor: '#2E2E2E', margin: '0 0 24px' }} />
                <Text style={{ fontSize: '14px', color: '#EAB308', margin: 0 }}>
                  Waitlist Position: #{waitlistPosition}
                </Text>
                <Text style={{ fontSize: '13px', color: '#A1A1A1', margin: '8px 0 0' }}>
                  We'll notify you immediately if a spot opens up.
                </Text>
              </>
            )}

            {!isWaitlisted && (
              <>
                <Hr style={{ borderColor: '#2E2E2E', margin: '0 0 24px' }} />
                <Text style={{ fontSize: '13px', color: '#A1A1A1', margin: 0 }}>
                  A calendar invite (.ics) is attached to this email. Add it to your calendar to stay reminded.
                </Text>
              </>
            )}
          </Section>

          <Text style={{ fontSize: '12px', color: '#6E6E6E', textAlign: 'center', marginTop: '24px' }}>
            © {new Date().getFullYear()} Computer Systems Engineering Department
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
