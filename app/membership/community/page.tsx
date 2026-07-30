'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Heart, Share2 } from 'lucide-react'

export default function MembershipCommunity() {
  const communityPosts = [
    {
      id: 1,
      author: 'Sarah Nakambi',
      role: 'Interior Designer',
      date: '2 days ago',
      title: 'Loving the new Coastal Dining Set!',
      excerpt:
        'Just installed the Coastal Dining Set in a client&apos;s home and the response has been incredible. The craftsmanship is flawless.',
      comments: 12,
      likes: 47,
      shares: 3,
    },
    {
      id: 2,
      author: 'James Kamau',
      role: 'Architect',
      date: '4 days ago',
      title: 'Question: Fabric recommendations for Savannah Sofa?',
      excerpt:
        'Planning to specify the Savannah sofa for a residential project. Which fabric options do you recommend for a high-traffic family home?',
      comments: 8,
      likes: 22,
      shares: 1,
    },
    {
      id: 3,
      author: 'The Revamp Team',
      role: 'Team',
      date: '1 week ago',
      title: 'New: Heritage Collection Relaunch',
      excerpt:
        'We&apos;re thrilled to announce the highly anticipated relaunch of our Heritage Collection with new designs and finishes.',
      comments: 34,
      likes: 89,
      shares: 15,
    },
  ]

  return (
    <PortalLayout
      title="Member Community"
      subtitle="Share ideas, ask questions, and connect with fellow designers and architects."
      portalType="membership"
    >
      <div className="space-y-8">
        {/* New Post */}
        <div className="border border-border/20 rounded-lg p-6 bg-muted/30">
          <p className="text-sm text-muted-foreground font-light mb-4">Share your experience</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Start a discussion..."
              className="flex-1 px-4 py-2 border border-border/20 rounded-none bg-background text-foreground placeholder:text-muted-foreground text-sm"
            />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
              Post
            </Button>
          </div>
        </div>

        {/* Community Posts */}
        <div className="space-y-4">
          {communityPosts.map(post => (
            <div
              key={post.id}
              className="border border-border/20 rounded-lg p-6 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-light text-primary">
                    {post.author
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{post.author}</p>
                  <p className="text-xs text-muted-foreground">{post.role}</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground">{post.date}</span>
              </div>

              <h3 className="font-serif text-lg font-light text-foreground mb-2">{post.title}</h3>
              <p className="text-muted-foreground font-light text-sm mb-4">{post.excerpt}</p>

              <div className="flex items-center justify-between pt-4 border-t border-border/20">
                <div className="flex gap-6 text-xs text-muted-foreground font-light">
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Heart className="w-4 h-4" />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Share2 className="w-4 h-4" />
                    {post.shares}
                  </button>
                </div>
                <Button variant="outline" size="sm" className="rounded-none">
                  Learn More
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
